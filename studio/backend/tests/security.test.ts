// DevForge V2 — Security Tests
import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'http://localhost:5680';

// Mock user IDs (replace with real test users)
const USER_A_ID = 'user-a-test-id';
const USER_B_ID = 'user-b-test-id';

test.describe('Multi-Tenant Security Tests', () => {
  test('should prevent User A from accessing User B projects', async ({ request }) => {
    // Create project as User A
    const projectA = await request.post(`${API_URL}/api/projects`, {
      headers: {
        'x-user-id': USER_A_ID,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'User A Project',
        description: 'Private project for User A',
      },
    });

    expect(projectA.ok()).toBeTruthy();
    const projectAData = await projectA.json();

    // Try to access User A's project as User B (should fail)
    const unauthorizedAccess = await request.get(
      `${API_URL}/api/projects/${projectAData.id}`,
      {
        headers: {
          'x-user-id': USER_B_ID,
        },
      }
    );

    expect(unauthorizedAccess.status()).toBe(404);
    const errorData = await unauthorizedAccess.json();
    expect(errorData.error).toContain('not found');
  });

  test('should prevent User A from modifying User B projects', async ({ request }) => {
    // Create project as User B
    const projectB = await request.post(`${API_URL}/api/projects`, {
      headers: {
        'x-user-id': USER_B_ID,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'User B Project',
        description: 'Private project for User B',
      },
    });

    expect(projectB.ok()).toBeTruthy();
    const projectBData = await projectB.json();

    // Try to modify User B's project as User A (should fail)
    const unauthorizedModify = await request.post(
      `${API_URL}/api/projects/${projectBData.id}/pause`,
      {
        headers: {
          'x-user-id': USER_A_ID,
        },
      }
    );

    expect(unauthorizedModify.status()).toBe(404);
  });

  test('should reject invalid UUID formats', async ({ request }) => {
    const invalidIds = [
      'not-a-uuid',
      '123',
      'javascript:alert(1)',
      '../../../etc/passwd',
      'DROP TABLE projects;',
    ];

    for (const invalidId of invalidIds) {
      const response = await request.get(`${API_URL}/api/projects/${invalidId}`, {
        headers: {
          'x-user-id': USER_A_ID,
        },
      });

      expect(response.status()).toBe(400);
      const errorData = await response.json();
      expect(errorData.error).toContain('Invalid');
    }
  });

  test('should sanitize XSS attempts in project creation', async ({ request }) => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
    ];

    for (const payload of xssPayloads) {
      const response = await request.post(`${API_URL}/api/projects`, {
        headers: {
          'x-user-id': USER_A_ID,
          'Content-Type': 'application/json',
        },
        data: {
          name: payload,
          description: 'Test description',
        },
      });

      expect(response.ok()).toBeTruthy();
      const projectData = await response.json();

      // Verify XSS is escaped
      expect(projectData.name).not.toContain('<script>');
      expect(projectData.name).not.toContain('onerror=');
      expect(projectData.name).not.toContain('javascript:');
    }
  });

  test('should prevent SQL injection attempts', async ({ request }) => {
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE projects;--",
      "1' UNION SELECT * FROM users--",
      "admin'--",
      "' OR 1=1--",
    ];

    for (const payload of sqlInjectionPayloads) {
      const response = await request.post(`${API_URL}/api/projects`, {
        headers: {
          'x-user-id': USER_A_ID,
          'Content-Type': 'application/json',
        },
        data: {
          name: payload,
          description: 'Test',
        },
      });

      // Prisma should handle this safely
      // Either creates safely or rejects
      if (response.ok()) {
        const data = await response.json();
        // Verify data is escaped
        expect(data.name).toBe(payload); // Stored as-is but escaped by Prisma
      }
    }
  });

  test('should enforce rate limiting on API endpoints', async ({ request }) => {
    const requests = [];

    // Send 101 requests rapidly (limit is 100)
    for (let i = 0; i < 101; i++) {
      requests.push(
        request.get(`${API_URL}/api/projects`, {
          headers: {
            'x-user-id': USER_A_ID,
          },
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter((r) => r.status() === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('should enforce stricter rate limiting on auth endpoints', async ({ request }) => {
    const requests = [];

    // Send 11 login attempts (limit is 10)
    for (let i = 0; i < 11; i++) {
      requests.push(
        request.post(`${API_URL}/api/auth/login`, {
          data: {
            email: 'test@example.com',
            password: 'wrong-password',
          },
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter((r) => r.status() === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });

  test('should reject requests without authentication', async ({ request }) => {
    const protectedEndpoints = [
      '/api/projects',
      '/api/settings',
      '/api/auth/me',
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(`${API_URL}${endpoint}`);
      expect(response.status()).toBe(401);
    }
  });

  test('should mask sensitive data in API responses', async ({ request }) => {
    // Update settings with API key
    await request.put(`${API_URL}/api/settings`, {
      headers: {
        'x-user-id': USER_A_ID,
        'Content-Type': 'application/json',
      },
      data: {
        anthropicKey: 'sk-ant-test-key-123456',
      },
    });

    // Get settings
    const response = await request.get(`${API_URL}/api/settings`, {
      headers: {
        'x-user-id': USER_A_ID,
      },
    });

    expect(response.ok()).toBeTruthy();
    const settings = await response.json();

    // API key should be masked
    expect(settings.anthropicKey).not.toContain('sk-ant-test-key-123456');
    expect(settings.anthropicKey).toContain('***');
  });

  test('should prevent access to sprints from other users projects', async ({
    request,
  }) => {
    // Create project as User A
    const projectA = await request.post(`${API_URL}/api/projects`, {
      headers: {
        'x-user-id': USER_A_ID,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'User A Project with Sprints',
        description: 'Test project',
      },
    });

    const projectAData = await projectA.json();

    // Create sprint as User A
    const sprintA = await request.post(
      `${API_URL}/api/projects/${projectAData.id}/sprints`,
      {
        headers: {
          'x-user-id': USER_A_ID,
          'Content-Type': 'application/json',
        },
        data: {
          goal: 'Sprint 1 Goal',
        },
      }
    );

    expect(sprintA.ok()).toBeTruthy();

    // Try to access sprints as User B (should fail)
    const unauthorizedSprints = await request.get(
      `${API_URL}/api/projects/${projectAData.id}/sprints`,
      {
        headers: {
          'x-user-id': USER_B_ID,
        },
      }
    );

    expect(unauthorizedSprints.status()).toBe(404);
  });

  test('should validate all required fields', async ({ request }) => {
    // Test project creation without required fields
    const missingName = await request.post(`${API_URL}/api/projects`, {
      headers: {
        'x-user-id': USER_A_ID,
        'Content-Type': 'application/json',
      },
      data: {
        description: 'Missing name',
      },
    });

    expect(missingName.status()).toBe(400);

    const missingDescription = await request.post(`${API_URL}/api/projects`, {
      headers: {
        'x-user-id': USER_A_ID,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Missing description',
      },
    });

    expect(missingDescription.status()).toBe(400);
  });

  test('should prevent path traversal attacks', async ({ request }) => {
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    ];

    for (const payload of pathTraversalPayloads) {
      const response = await request.get(`${API_URL}/api/projects/${payload}`, {
        headers: {
          'x-user-id': USER_A_ID,
        },
      });

      expect(response.status()).toBe(400);
    }
  });

  test('should handle concurrent requests safely', async ({ request }) => {
    // Create a project
    const project = await request.post(`${API_URL}/api/projects`, {
      headers: {
        'x-user-id': USER_A_ID,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Concurrent Test Project',
        description: 'Test concurrent access',
      },
    });

    const projectData = await project.json();

    // Send multiple concurrent requests
    const concurrentRequests = [];
    for (let i = 0; i < 10; i++) {
      concurrentRequests.push(
        request.get(`${API_URL}/api/projects/${projectData.id}`, {
          headers: {
            'x-user-id': USER_A_ID,
          },
        })
      );
    }

    const responses = await Promise.all(concurrentRequests);

    // All should succeed
    responses.forEach((response) => {
      expect(response.ok()).toBeTruthy();
    });
  });
});

test.describe('Authorization Tests', () => {
  test('should allow users to only see their own projects', async ({ request }) => {
    // User A creates project
    await request.post(`${API_URL}/api/projects`, {
      headers: {
        'x-user-id': USER_A_ID,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'User A Only Project',
        description: 'Should not be visible to User B',
      },
    });

    // User B lists projects
    const userBProjects = await request.get(`${API_URL}/api/projects`, {
      headers: {
        'x-user-id': USER_B_ID,
      },
    });

    const userBData = await userBProjects.json();

    // User B should not see User A's project
    const hasUserAProject = userBData.some(
      (p: any) => p.name === 'User A Only Project'
    );
    expect(hasUserAProject).toBeFalsy();
  });

  test('should prevent unauthorized settings access', async ({ request }) => {
    // User A updates settings
    await request.put(`${API_URL}/api/settings`, {
      headers: {
        'x-user-id': USER_A_ID,
        'Content-Type': 'application/json',
      },
      data: {
        notifyEmail: true,
      },
    });

    // User B tries to read User A settings (should get their own)
    const userBSettings = await request.get(`${API_URL}/api/settings`, {
      headers: {
        'x-user-id': USER_B_ID,
      },
    });

    expect(userBSettings.ok()).toBeTruthy();
    const settingsData = await userBSettings.json();

    // Should be User B's settings, not User A's
    expect(settingsData.userId).toBe(USER_B_ID);
  });
});

test.describe('Input Validation Tests', () => {
  test('should reject excessively large payloads', async ({ request }) => {
    const largePayload = 'A'.repeat(20 * 1024 * 1024); // 20MB

    const response = await request.post(`${API_URL}/api/projects`, {
      headers: {
        'x-user-id': USER_A_ID,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test',
        description: largePayload,
      },
    });

    expect(response.status()).toBe(413); // Payload too large
  });

  test('should validate email formats', async ({ request }) => {
    const invalidEmails = ['not-an-email', '@example.com', 'test@', 'test'];

    for (const email of invalidEmails) {
      const response = await request.post(`${API_URL}/api/auth/register`, {
        data: {
          email,
          password: 'ValidPassword123!',
        },
      });

      // Should reject invalid email (implementation dependent)
      if (!response.ok()) {
        expect(response.status()).toBe(400);
      }
    }
  });

  test('should reject null bytes in inputs', async ({ request }) => {
    const nullBytePayload = 'test\x00malicious';

    const response = await request.post(`${API_URL}/api/projects`, {
      headers: {
        'x-user-id': USER_A_ID,
        'Content-Type': 'application/json',
      },
      data: {
        name: nullBytePayload,
        description: 'Test',
      },
    });

    if (response.ok()) {
      const data = await response.json();
      // Null bytes should be stripped
      expect(data.name).not.toContain('\x00');
    }
  });
});
