exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                      'mongodb://dbuser:password@ds143539.mlab.com:43539/blog-app';
exports.TEST_DATABASE_URL = (
	process.env.TEST_DATABASE_URL ||
	'mongodb://dbuser:dbpassword@ds151202.mlab.com:51202/blog-app-test');
exports.PORT = process.env.PORT || 8080;