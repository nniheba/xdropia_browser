import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

export class DB {
  private static instance: DB;
  private db: Database.Database;

  private constructor() {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'xdropia.db');
    
    this.db = new Database(dbPath, { verbose: console.log });
    this.initDatabase();
  }

  public static getInstance(): DB {
    if (!DB.instance) {
      DB.instance = new DB();
    }
    return DB.instance;
  }

  private initDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        plan TEXT NOT NULL,
        active_sessions INTEGER DEFAULT 0,
        max_sessions INTEGER DEFAULT 1,
        last_login TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        status TEXT NOT NULL,
        plan TEXT NOT NULL,
        expires_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `);
  }

  public getUser(email: string): any {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  public createUser(user: any): void {
    const stmt = this.db.prepare(
      'INSERT INTO users (id, email, plan, max_sessions) VALUES (?, ?, ?, ?)'
    );
    stmt.run(user.id, user.email, user.plan, user.maxSessions || 1);
  }

  public updateUserSessions(userId: string, activeSessions: number): void {
    const stmt = this.db.prepare(
      'UPDATE users SET active_sessions = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?'
    );
    stmt.run(activeSessions, userId);
  }

  public getCredentials(plan: string): any[] {
    const stmt = this.db.prepare(
      'SELECT id, service, status, plan, expires_at FROM credentials WHERE plan = ? OR plan = "free"'
    );
    return stmt.all(plan);
  }

  public getCredentialById(id: string): any {
    const stmt = this.db.prepare('SELECT * FROM credentials WHERE id = ?');
    return stmt.get(id);
  }

  public createCredential(credential: any): void {
    const stmt = this.db.prepare(
      'INSERT INTO credentials (id, service, email, password, status, plan, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(
      credential.id,
      credential.service,
      credential.email,
      credential.password,
      credential.status,
      credential.plan,
      credential.expiresAt
    );
  }

  public updateCredentialStatus(id: string, status: string): void {
    const stmt = this.db.prepare('UPDATE credentials SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }

  public createSession(session: any): void {
    const stmt = this.db.prepare(
      'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    );
    stmt.run(session.id, session.userId, session.token, session.expiresAt);
  }

  public deleteSession(token: string): void {
    const stmt = this.db.prepare('DELETE FROM sessions WHERE token = ?');
    stmt.run(token);
  }

  public getSessionsByUserId(userId: string): any[] {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE user_id = ?');
    return stmt.all(userId);
  }
}

export default DB.getInstance();
