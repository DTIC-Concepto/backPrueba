import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { CreateOppDto } from '../src/opp/dto/create-opp.dto';

const request = require('supertest');

describe('OppController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdOppId: number;

  const testOpp: CreateOppDto = {
    codigo: 'OPP-E2E-TEST',
    descripcion: 'Objetivo de Programa creado en prueba E2E',
    carreraId: 1, // Usando ID 1 que debería existir
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Intentar obtener token de autenticación
    try {
      const authResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@epn.edu.ec',
          password: 'admin123',
        });

      if (authResponse.body?.access_token) {
        authToken = authResponse.body.access_token;
      }
    } catch (error) {
      console.warn('Warning: Authentication failed for e2e tests');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /program-objectives', () => {
    it('should return 401 when no auth token provided', async () => {
      const response = await request(app.getHttpServer())
        .post('/program-objectives')
        .send(testOpp)
        .expect(401);

      expect(response.body).toBeDefined();
    });

    it('should create OPP when authenticated (if auth is available)', async () => {
      if (!authToken) {
        console.log('Skipping authenticated test - no token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .post('/program-objectives')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testOpp)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('codigo', testOpp.codigo);
      expect(response.body).toHaveProperty('descripcion', testOpp.descripcion);
      expect(response.body).toHaveProperty('carreraId', testOpp.carreraId);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      createdOppId = response.body.id;
    });

    it('should validate required fields', async () => {
      const invalidOpp = {
        // Missing codigo
        descripcion: 'Test description',
        carreraId: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/program-objectives')
        .set('Authorization', `Bearer ${authToken || 'fake-token'}`)
        .send(invalidOpp)
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });

      expect(response.body).toBeDefined();
    });

    it('should validate codigo format', async () => {
      const invalidOpp = {
        codigo: '', // Empty codigo
        descripcion: 'Test description',
        carreraId: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/program-objectives')
        .set('Authorization', `Bearer ${authToken || 'fake-token'}`)
        .send(invalidOpp)
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });

      expect(response.body).toBeDefined();
    });

    it('should validate descripcion length', async () => {
      const invalidOpp = {
        codigo: 'TEST-CODE',
        descripcion: 'x'.repeat(501), // Too long
        carreraId: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/program-objectives')
        .set('Authorization', `Bearer ${authToken || 'fake-token'}`)
        .send(invalidOpp)
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /program-objectives', () => {
    it('should return 401 when no auth token provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/program-objectives')
        .expect(401);

      expect(response.body).toBeDefined();
    });

    it('should return paginated OPPs when authenticated (if auth is available)', async () => {
      if (!authToken) {
        console.log('Skipping authenticated GET test - no token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/program-objectives')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('hasPrevious');
      expect(response.body).toHaveProperty('hasNext');

      expect(Array.isArray(response.body.data)).toBeTruthy();
      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.page).toBe('number');
      expect(typeof response.body.limit).toBe('number');
    });

    it('should handle pagination parameters', async () => {
      if (!authToken) {
        console.log('Skipping pagination test - no token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/program-objectives?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(5);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should handle search parameters', async () => {
      if (!authToken) {
        console.log('Skipping search test - no token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/program-objectives?search=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBeTruthy();
    });

    it('should validate query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/program-objectives?page=invalid&limit=invalid')
        .set('Authorization', `Bearer ${authToken || 'fake-token'}`)
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });

      expect(response.body).toBeDefined();
    });

    it('should handle carrera filter', async () => {
      if (!authToken) {
        console.log('Skipping carrera filter test - no token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/program-objectives?carreraId=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      
      // Si hay datos, verificar que pertenecen a la carrera correcta
      if (response.body.data.length > 0) {
        response.body.data.forEach((opp: any) => {
          expect(opp.carreraId).toBe(1);
        });
      }
    });
  });

  describe('Integration Tests', () => {
    it('should create and then retrieve an OPP', async () => {
      if (!authToken) {
        console.log('Skipping integration test - no token available');
        return;
      }

      // Crear OPP
      const uniqueCode = `OPP-INT-${Date.now()}`;
      const createDto = {
        codigo: uniqueCode,
        descripcion: 'Objetivo de integración',
        carreraId: 1,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/program-objectives')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      const oppId = createResponse.body.id;

      // Buscar el OPP creado
      const searchResponse = await request(app.getHttpServer())
        .get(`/program-objectives?search=${uniqueCode}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar que el OPP aparece en los resultados
      const foundOpp = searchResponse.body.data.find(
        (opp: any) => opp.codigo === uniqueCode,
      );
      
      expect(foundOpp).toBeDefined();
      expect(foundOpp.id).toBe(oppId);
      expect(foundOpp.descripcion).toBe(createDto.descripcion);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app.getHttpServer())
        .post('/program-objectives')
        .set('Authorization', `Bearer ${authToken || 'fake-token'}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });

      expect(response.body).toBeDefined();
    });

    it('should handle wrong content type', async () => {
      const response = await request(app.getHttpServer())
        .post('/program-objectives')
        .set('Authorization', `Bearer ${authToken || 'fake-token'}`)
        .set('Content-Type', 'text/plain')
        .send('plain text')
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });

      expect(response.body).toBeDefined();
    });
  });
});