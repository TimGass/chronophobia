import chai from 'chai';
import request from 'supertest';
import Server from '../server';
import uuid from 'uuid';
import moment from 'moment';

const expect = chai.expect;

describe('Categories', () => {
  let creds = {};
  creds.name = uuid().replace(/-/g, '').slice(0, 20);
  creds.password = uuid().slice(0, 20);

  it('Should post a user', () =>
    request(Server)
      .post('/api/users')
      .send({ username: creds.name, email: `${creds.name}@swag.com`, password: creds.password, currentDayStart: `${moment().hour(0).minute(0).second(0).utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS)}Z` })
      .expect('Content-Type', /json/)
      .then(r => {
        if (r.body && r.body._id) {
          creds.id = r.body._id;
        }
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

  it('Should post a category', () =>
    request(Server)
      .post('/api/categories')
      .set('accesstoken', creds.token)
      .send({ name: creds.name })
      .expect('Content-Type', /json/)
      .then(r => {
        creds.category = {};
        creds.category.id = r.body.categories[r.body.categories.length - 1]._id;
        creds.category.length = r.body.categories.length;
        expect(r.body.categories[r.body.categories.length - 1])
          .to.be.an('object')
          .that.has.property('name')
              .equal(creds.name);
      }));

  it('Should delete a category', () =>
    request(Server)
      .delete('/api/categories')
      .set('accesstoken', creds.token)
      .send({ id: creds.category.id })
      .expect('Content-Type', /json/)
      .then(r => {
        expect(r.body.categories)
          .to.be.an('array')
          .of.length(creds.category.length - 1);
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
