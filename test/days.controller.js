import chai from 'chai';
import request from 'supertest';
import {v4 as uuid } from 'uuid';
import moment from 'moment';
import chai_things from 'chai-things';
import Server from '../server.js';

chai.should();
chai.use(chai_things);
const expect = chai.expect;

describe('Days', () => {
  let creds = {};
  creds.name = uuid().replace(/-/g, '').slice(0, 20);
  creds.password = uuid().slice(0, 20);
  let userModel = {};
  let storedDay = {};
  let days = [];

  it('Should post a user', () =>
    request(Server)
      .post('/api/users')
      .send({ username: creds.name, email: `${creds.name}@swag.com`, password: creds.password, currentDayStart: `${moment().hour(0).minute(0).second(0).utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS)}Z` })
      .expect('Content-Type', /json/)
      .then(r => {
        if (r.body && r.body._id) {
          creds.id = r.body._id;
          userModel = r.body;
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

  it('Should post an activity', () =>
    request(Server)
      .post('/api/activities')
      .set('accesstoken', creds.token)
      .send({ startedAt: `${moment().utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS)}Z`,  category: userModel.categories[0]._id, currentMidnight: `${moment().hour(0).minute(0).second(0).utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS)}Z` })
      .expect('Content-Type', /json/)
      .then(r => {
        storedDay = r.body;
        expect(r.body)
          .to.be.an('object')
          .that.has.property('activities')
          .which.includes.something
          .that.has.property('category', userModel.categories[0].name);
      }));

  it('Should get the currentDay', () =>
    request(Server)
      .get('/api/me')
      .set('accesstoken', creds.token)
      .expect('Content-Type', /json/)
      .then(r => {
        expect(r.body)
          .to.be.an('object')
          .that.has.property('currentDay')
          .that.has.property('_id')
          .equal(storedDay._id);
      }));

  it('Should have our activity in days array', () =>
    request(Server)
      .get('/api/days')
      .set('accesstoken', creds.token)
      .expect('Content-Type', /json/)
      .then(r => {
        days = r.body;
        expect(r.body[1].activities)
          .to.be.an('array')
          .to.have.lengthOf(1)
          .that.includes.something
          .that.has.property('_id', storedDay.activities[0]._id);
      }));

  it('Should change our activity', () =>
    request(Server)
      .patch('/api/days')
      .set('accesstoken', creds.token)
      .send({ id: days[1]._id,
        activities: [{ id: days[1].activities[0]._id, category: userModel.categories[1]._id }] })
      .expect('Content-Type', /json/)
      .then(r => {
        days[1] = r.body;
        expect(r.body.activities)
          .to.be.an('array')
          .to.have.lengthOf(1)
          .that.includes.something
          .that.has.property('category', userModel.categories[1].name);
      }));

  it('Should remove our activity', () =>
    request(Server)
      .patch('/api/days')
      .set('accesstoken', creds.token)
      .send({ id: days[1]._id,
        activities: [{ id: days[1].activities[0]._id, action: 'REMOVE' }] })
      .expect('Content-Type', /json/)
      .then(r => {
        expect(r.body.activities)
          .to.be.an('array')
          .to.have.lengthOf(0)
          .that.include.something
          .that.should.not.have.property('_id', storedDay.activities[0]._id);
      }));

  it('Should create a day', () =>
    request(Server)
      .post('/api/days')
      .set('accesstoken', creds.token)
      .send({ startedAt: `${moment().hour(0).minute(0).second(0).subtract(24, 'hours').utc().format(moment.HTML5_FMT.DATETIME_LOCAL_MS)}Z` })
      .expect('Content-Type', /json/)
      .then(r => {
        expect(r.body)
          .to.be.an('object')
          .that.has.property('_id');
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
