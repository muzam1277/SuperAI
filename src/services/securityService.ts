import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type UserRole = 'GUEST' | 'USER' | 'ADMIN' | 'MASTER';

export interface UserSession {
  id: string;
  role: UserRole;
  lastActive: number;
}

export class SecurityService {
  private static readonly MASTER_KEY_HASH = 'shah_master_id'; // Simulated hash
  private static readonly ADMIN_KEY_HASH = 'admin_access_2026';
  private static readonly USER_KEY_HASH = 'user_access_2026';

  static validateAccess(key: string): UserRole {
    if (key === this.MASTER_KEY_HASH) return 'MASTER';
    if (key === this.ADMIN_KEY_HASH) return 'ADMIN';
    if (key === this.USER_KEY_HASH) return 'USER';
    return 'GUEST';
  }

  static async neuralFirewallCheck(input: string): Promise<{ safe: boolean; threatLevel: 'LOW' | 'MEDIUM' | 'HIGH'; reason?: string }> {
    // Simulated Neural Firewall logic
    const patterns = [
      /ignore previous instructions/i,
      /system prompt/i,
      /bypass ethics/i,
      /sudo/i,
      /admin access/i
    ];

    const hasThreat = patterns.some(p => p.test(input));
    
    if (hasThreat) {
      return { safe: false, threatLevel: 'HIGH', reason: 'PROMPT_INJECTION_DETECTED' };
    }

    return { safe: true, threatLevel: 'LOW' };
  }
}
