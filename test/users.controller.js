import chai from 'chai';
import request from 'supertest';
import Server from '../server';
import uuid from 'uuid/v4';
import moment from 'moment';

const expect = chai.expect;

describe('Users', () => {
  let creds = {};
  creds.name = uuid().replace(/-/g, '').slice(0, 20);
  creds.password = uuid().slice(0, 20);
  creds.updateName = uuid().replace(/-/g, '').slice(0, 20);

  it('Should post a user', () =>
    request(Server)
      .post('/api/users')
      .send({ username: creds.name, email: `${creds.name}@swag.com`, password: creds.password, currentDayStart: `${moment().hour(0).minute(0).second(0).utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS)}Z` })
      .expect('Content-Type', /json/)
      .then(r => {
        expect(r.body)
          .to.be.an('object')
          .that.has.property('username')
          .equal(creds.name)
      }));

  it('Should login a user', () =>
    request(Server)
      .post('/api/login')
      .send({ emailOrUsername: creds.name, password: creds.password })
      .expect('Content-Type', /json/)
      .then(r => {
        if (r.body && r.body.accessToken) {
          creds.token = r.body.accessToken;
        }
        expect(r.body)
          .to.be.an('object')
          .that.has.property('accessToken');
      }));

  it('Should update a user', () =>
    request(Server)
      .patch('/api/users')
      .set('accesstoken', creds.token)
      .send({ username: creds.updateName })
      .expect('Content-Type', /json/)
      .then(r => {
        expect(r.body)
          .to.be.an('object')
          .that.has.property('username')
          .equal(creds.updateName)
      }));

  it('Should find the logged in user', () =>
    request(Server)
      .get('/api/me')
      .set('accesstoken', creds.token)
      .expect('Content-Type', /json/)
      .then(r => {
        if (r.body && r.body._id) {
          creds.id = r.body._id;
        }
        expect(r.body)
          .to.be.an('object')
          .that.has.property('username')
          .equal(creds.updateName);
      }));

  it('Should delete a user', () =>
    request(Server)
      .delete('/api/users')
      .set('accesstoken', creds.token)
      .send({ id: creds.id })
      .expect('Content-Type', /json/)
      .then(r => {
        expect(r.body)
          .to.be.an('object')
          .that.has.property('code')
          .equal('REMOVED');
      }));
});
