// Team Types

export interface HumanMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  online: boolean;
}

export interface AIAgent {
  id: string;
  name: string;
  model: string;
  icon: string;
  color: string;
  active: boolean;
}

export interface Activity {
  id: number;
  time: string;
  actor: string;
  ai: boolean;
  icon: string;
  msg: string;
  badge: string;
}
