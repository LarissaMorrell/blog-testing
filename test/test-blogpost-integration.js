const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const { BlogPost } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);


function seeBlogData() {
    console.info('seeding blog post data');
    const seedData = [];

    //create 10 posts
    for (let i = 1; i < 10; i++) {
        seedData.push(generateBlogPostData());
    }

    //return a promise
    return BlogPost.insertMany(seedData);
}

function generateBlogPostData() {
    return {
        author: generateAuthorName(),
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs()
            //published?
    }
}

function generateAuthorName() {
    return {
        "firstName": faker.name.firstName(),
        "lastName": faker.name.lastName()
    }
}

function tearDownDb() {
    console.warn('Deleting database');
    return mongoose.connection.dropDatabase();
}

describe('Blog Post API resource', function() {

    before(function() {
        return runServer(TEST_DATABASE_URL);
    });
    beforeEach(function() {
        return seeBlogData();
    });
    afterEach(function() {
        return tearDownDb();
    });
    after(function() {
        closeServer();
    });

    describe('GET endpoint', function() {
        it('should return all existing blog posts', function() {

            let res;
            return chai.request(app)
                .get('/posts')
                .then(function(_res) {
                    res = _res;
                    res.should.have.status(200);
                    // console.log('\n\n\n\n\nbody:\n', res.body);
                    res.body.should.have.length.of.at.least(1);
                    return BlogPost.count();
                })
                .then(function(count){
                	// res.body.should.have.length.of(count);
                });
        });

        it('should return blog posts with right fields'), function() {
        	return chai.request(app)
	        	.get('/posts')
	        	.then(function(res){
	        		res.should.have.status(200);
	        		res.should.be.json;
	        		res.body.should.be.a('array');
	        		res.body.should.have.length.of.at.least(1);

	        		resPost = res.body[0];
	        		return BlogPost.findById(resPost.id);
	        	})

        }
    });




});
