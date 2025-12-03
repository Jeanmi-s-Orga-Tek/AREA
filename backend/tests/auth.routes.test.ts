import request from 'supertest';
import app from '../src/app';
// ...existing imports éventuels (db, helpers)...

describe('Auth routes', () => {
  beforeAll(async () => {
    // ...initialisation DB de test / connexion...
  });

  beforeEach(async () => {
    // ...reset/clean DB (truncate tables, etc.)...
  });

  afterAll(async () => {
    // ...fermeture DB / server...
  });

  describe('POST /auth/register', () => {
    it('should register a user with valid data', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'user@test.com',
          password: 'StrongPassw0rd!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', 'user@test.com');
      // ...autres assertions (pas de mot de passe en clair, etc.)...
    });

    it('should return 400 if email already exists', async () => {
      // Arrange: créer un user existant
      // ...création user dans la DB (via modèle ou service)...

      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'user@test.com',
          password: 'StrongPassw0rd!',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      // ...éventuellement vérifier message d’erreur spécifique...
    });

    it('should return 400 if password is too weak', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'weak@test.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      // ...vérifier que l’erreur indique un mot de passe invalide...
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // Arrange: créer un user avec mot de passe connu
      // ...création user dans la DB (mot de passe hashé)...

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@test.com',
          password: 'StrongPassw0rd!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      // ...vérifier éventuellement autre info (refresh token, user payload)...
    });

    it('should return 401 for wrong password', async () => {
      // Arrange: user existant
      // ...création user dans la DB...

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@test.com',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      // ...vérifier message "Invalid credentials" ou similaire...
    });

    it('should return 404 for non-existing user', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'unknown@test.com',
          password: 'SomePassword123!',
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });
});

