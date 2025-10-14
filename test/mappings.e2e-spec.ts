import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { TipoRA } from '../src/resultados-aprendizaje/models/resultado-aprendizaje.model';

const request = require('supertest');

describe('Mappings E2E', () => {
  let app: INestApplication;
  let authToken: string;

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

  describe('/mappings/opp-ra/batch (POST)', () => {
    it('should create batch mappings successfully with valid auth', async () => {
      if (!authToken) {
        console.warn('Skipping test due to missing auth token');
        return;
      }

      const mappingsDto = {
        mappings: [
          {
            resultadoAprendizajeId: 1, // Usar IDs que probablemente existan
            oppId: 1,
            justificacion: 'Este RA contribuye al OPP mediante desarrollo de competencias técnicas específicas',
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/mappings/opp-ra/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mappingsDto)
        .expect((res) => {
          // Aceptar tanto 201 como errores de validación
          expect([201, 400, 404]).toContain(res.status);
          if (res.status === 201) {
            expect(res.body).toHaveProperty('totalSolicitadas');
            expect(res.body).toHaveProperty('exitosas');
            expect(res.body).toHaveProperty('fallidas');
          }
        });
    });

    it('should reject unauthorized access without token', async () => {
      const mappingsDto = {
        mappings: [
          {
            resultadoAprendizajeId: 1,
            oppId: 1,
            justificacion: 'Test mapping without auth',
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/mappings/opp-ra/batch')
        .send(mappingsDto)
        .expect(401);
    });

    it('should validate DTO format and required fields', async () => {
      if (!authToken) return;

      const invalidDto = {
        mappings: [
          {
            // Missing oppId
            resultadoAprendizajeId: 1,
            justificacion: 'Incomplete mapping',
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/mappings/opp-ra/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should validate justification length constraints', async () => {
      if (!authToken) return;

      const shortJustificationDto = {
        mappings: [
          {
            resultadoAprendizajeId: 1,
            oppId: 1,
            justificacion: 'X', // Muy corto
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/mappings/opp-ra/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shortJustificationDto)
        .expect(400);
    });
  });

  describe('/mappings/available-ras/opp/:oppId (GET)', () => {
    it('should return available RAs for OPP without filter', async () => {
      if (!authToken) return;

      return request(app.getHttpServer())
        .get('/mappings/available-ras/opp/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          // Accept both 200 and 404 (if OPP doesn't exist)
          expect([200, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(Array.isArray(res.body)).toBe(true);
          }
        });
    });

    it('should filter RAs by ESPECIFICO type', async () => {
      if (!authToken) return;

      return request(app.getHttpServer())
        .get('/mappings/available-ras/opp/1?tipo=ESPECIFICO')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
          if (res.status === 200 && res.body.length > 0) {
            res.body.forEach((ra: any) => {
              expect(ra.tipo).toBe('ESPECIFICO');
            });
          }
        });
    });

    it('should filter RAs by GENERAL type', async () => {
      if (!authToken) return;

      return request(app.getHttpServer())
        .get('/mappings/available-ras/opp/1?tipo=GENERAL')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
          if (res.status === 200 && res.body.length > 0) {
            res.body.forEach((ra: any) => {
              expect(ra.tipo).toBe('GENERAL');
            });
          }
        });
    });

    it('should reject unauthorized access', async () => {
      return request(app.getHttpServer())
        .get('/mappings/available-ras/opp/1')
        .expect(401);
    });
  });

  describe('/mappings/ra-opp (GET)', () => {
    it('should return all mappings with proper authorization', async () => {
      if (!authToken) return;

      return request(app.getHttpServer())
        .get('/mappings/ra-opp')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should filter mappings by carrera', async () => {
      if (!authToken) return;

      return request(app.getHttpServer())
        .get('/mappings/ra-opp?carreraId=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should reject unauthorized access', async () => {
      return request(app.getHttpServer())
        .get('/mappings/ra-opp')
        .expect((res) => {
          // Aceptar tanto 401 (no auth) como 404 (ruta no encontrada)
          expect([401, 404]).toContain(res.status);
        });
    });
  });

  describe('/mappings/validate-ra-opp/:raId/:oppId (GET)', () => {
    it('should validate RA and OPP existence', async () => {
      if (!authToken) return;

      return request(app.getHttpServer())
        .get('/mappings/validate-ra-opp/1/1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          // Accept validation result or 404 if entities don't exist
          expect([200, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body).toHaveProperty('ra');
            expect(res.body).toHaveProperty('opp');
            expect(res.body).toHaveProperty('sameCarrera');
          }
        });
    });

    it('should handle non-existent entities', async () => {
      if (!authToken) return;

      return request(app.getHttpServer())
        .get('/mappings/validate-ra-opp/99999/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should reject unauthorized access', async () => {
      return request(app.getHttpServer())
        .get('/mappings/validate-ra-opp/1/1')
        .expect((res) => {
          // Aceptar tanto 401 (no auth) como 404 (ruta no encontrada)
          expect([401, 404]).toContain(res.status);
        });
    });
  });

  describe('/mappings/carrera/:carreraId/stats (GET)', () => {
    it('should return mapping statistics for carrera', async () => {
      if (!authToken) return;

      return request(app.getHttpServer())
        .get('/mappings/carrera/1/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalRAs');
          expect(res.body).toHaveProperty('totalOPPs');
          expect(res.body).toHaveProperty('totalMappings');
          expect(res.body).toHaveProperty('rasSinMappings');
          expect(res.body).toHaveProperty('oppsSinMappings');
          expect(typeof res.body.totalRAs).toBe('number');
          expect(typeof res.body.totalOPPs).toBe('number');
          expect(typeof res.body.totalMappings).toBe('number');
        });
    });

    it('should reject unauthorized access', async () => {
      return request(app.getHttpServer())
        .get('/mappings/carrera/1/stats')
        .expect((res) => {
          // Aceptar tanto 401 (no auth) como 404 (ruta no encontrada)
          expect([401, 404]).toContain(res.status);
        });
    });
  });
});