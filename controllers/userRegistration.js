const bluebird = require('bluebird');
const pgp = require('pg-promise')({ promiseLib: bluebird });
const dbCredentials = require('../config').DB[process.env.NODE_ENV];
const db = pgp(dbCredentials);
const { normaliseData, sortByUsername } = require('../lib/helper');

function userRegistration (req, res) {
    // Add username 
    // security isActive?
    db.one('INSERT INTO users(username) VALUES ($1) RETURNING id', [req.body.username])
        .then((user) => {
            res.status(201).send({
                user_id: user.id
            });
        })
        .catch(error => {
            res.status(404).send({
                status: error
            });
        });
}

function usersRegistered (req, res) {
    db.any('SELECT * FROM users')
        .then(users => {
            res.status(200).send({
                user: normaliseData(users)
            });
        })
        .catch(error => {
            res.status(404).send({
                status: error
            });
        });
}

module.exports = {
    userRegistration,
    usersRegistered,
    testReg
};

function testReg (req, res, next) {
    db.task(t => {
        return t.any('SELECT DISTINCT username FROM users WHERE username = $1', [req.body.username])
            .then((users, error) => {
                users = sortByUsername(users);
                console.log(users);
                    if (!users) {
                        return next();
                    } else {
                        throw error;
                    }
            })
            .then(() => {
                console.log('IM NOW HERE');
                return t.one('INSERT INTO users(username) VALUES ($1) RETURNING id', 
                    [req.body.username]);
            })
            .then(() => {
                res.status(201).send({
                    status: 'NEW USER CREATED - OK'
                });
            })
            .catch(error => {
                console.log('THIS IS AN ERROR', error);
                res.status(404).send({ status: error });
            });
    });
}