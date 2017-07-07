const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const should = chai.should();

const { BlogPost } = require('../models');
const { app, runServer, closeServer } = require('../server');
const { TEST_DATABASE_URL } = require('../config');

chai.use(chaiHttp);


function seedBlogData() {
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
        return seedBlogData();
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
                	res.body.should.have.lengthOf(count);
                });
        });

        it('should return blog posts with right fields', function() {

            let resPost;
        	return chai.request(app)
	        	.get('/posts')
	        	.then(function(res){
                    //check types of response
	        		res.should.have.status(200);
	        		res.should.be.json;
	        		res.body.should.be.a('array');
	        		res.body.should.have.length.of.at.least(1);

                    //each res obj in array has the right keys
                    res.body.forEach(function(post){
                        post.should.be.a('object');
                        post.should.include.keys('id', 'title', 'content', 'author', 'created');
                    });

                    //for the first post get id then get same one from db
	        		resPost = res.body[0];
	        		return BlogPost.findById(resPost.id);
	        	})

                //check the res from server against the one from the db
                .then(function(post){
                    resPost.id.should.equal(post.id);
                    resPost.title.should.equal(post.title);
                    resPost.content.should.equal(post.content);

                    let postRepr = post.apiRepr();
                    resPost.author.should.equal(postRepr.author);
                    //created
                })
        });
    });
    describe('POST endpoint', function(){

        it('should add a new blog post', function(){
            const newPost = generateBlogPostData();

            return chai.request(app)
                .post('/posts')
                .send(newPost)
                .then(function(res){
                    res.should.have.status(201);
                    res.should.be.json;
                    res.body.should.be.a('object');
                    res.body.should.include.keys('id', 'title', 'content', 'author', 'created');
                    res.body.id.should.not.be.null;
                    res.body.title.should.equal(newPost.title);
                    res.body.content.should.equal(newPost.content);
                    res.body.author.should.equal( //virtual
                        `${newPost.author.firstName} ${newPost.author.lastName}`);
                    return BlogPost.findById(res.body.id);
                })
                .then(function(post){
                    post.title.should.equal(newPost.title);
                    post.content.should.equal(newPost.content);

                    console.log('post.author', post.author);
                    console.log('newPost.author', newPost.author);
                    post.author.firstName.should.equal(newPost.author.firstName);
                    post.author.lastName.should.equal(newPost.author.lastName);
                    //created
                })
        })
    })

    describe('PUT endpoint', function(){
        it('should update the fields you send over', function(){
            const updateData = {
                author: {
                    firstName: 'mama',
                    lastName: 'dada'
                },
                content: 'insert something witty here'
            }

            return BlogPost
                .findOne()
                .exec()
                .then(function(post){
                    updateData.id = post.id;
                    return chai.request(app)
                        .put(`/posts/${post.id}`)
                        .send(updateData);
                })
                .then(function(res){
                    res.should.have.status(201);
                    return BlogPost.findById(updateData.id).exec();
                })
                .then(function(post){
                    post.content.should.equal(updateData.content);
                    post.author.firstName.should.equal(updateData.author.firstName);
                    post.author.lastName.should.equal(updateData.author.lastName);
                })
        })
    })

    describe('DELETE endpoint', function(){
        it('should delete a blog post by id', function(){

            let post;
            return BlogPost
                .findOne()
                .exec()
                .then(function(_post){
                    post = _post;
                    return chai.request(app).delete(`/posts/${post.id}`);
                })
                .then(function(res){
                    res.should.have.status(204);
                    return BlogPost.findById(post.id).exec();
                })
                .then(function(_post){
                    should.not.exist(_post);
                })
        })
    })
});
