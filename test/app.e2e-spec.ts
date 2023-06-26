import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should sign up successfully', async () => {
    const payload = {
      email: 'test@example.com',
      password: 'testpassword',
    };

    const response = await request(server)
      .post('/sign-up')
      .send(payload)
      .expect(201);

    expect(response.body).toBeDefined();
  });

  it('should confirm sign up successfully', async () => {
    const payload = {
      email: 'test@example.com',
      code: '123456',
    };

    const response = await request(server)
      .post('/confirm-sign-up')
      .send(payload)
      .expect(200);

    expect(response.body).toBeDefined();
  });

  it('should sign in successfully', async () => {
    const payload = {
      email: 'test@example.com',
      password: 'testpassword',
    };

    const response = await request(server)
      .post('/sign-in')
      .send(payload)
      .expect(200);

    expect(response.body).toBeDefined();
  });

  it('should forget password successfully', async () => {
    const payload = {
      email: 'test@example.com',
    };

    const response = await request(server)
      .post('/forget-password')
      .send(payload)
      .expect(200);

    expect(response.body).toBeDefined();
  });

  it('should confirm forget password successfully', async () => {
    const payload = {
      email: 'test@example.com',
      code: '123456',
      newPassword: 'newpassword',
    };

    const response = await request(server)
      .post('/confirm-forget-password')
      .send(payload)
      .expect(200);

    expect(response.body).toBeDefined();
  });

  it('should update profile successfully', async () => {
    const payload = {
      age: 25,
      gender: 'female',
    };

    const response = await request(server)
      .post('/update-profile')
      .send(payload)
      .set('Authorization', 'Bearer {token}')
      .expect(200);

    expect(response.body).toBeDefined();
  });

  it('should delete account successfully', async () => {
    const response = await request(server)
      .delete('/delete-account')
      .set('Authorization', 'Bearer {token}')
      .expect(200);

    expect(response.body).toBeDefined();
  });
});
