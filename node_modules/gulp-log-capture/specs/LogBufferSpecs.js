var expect = require('chai').expect;
var sinon  = require('sinon');
var logCapture = require('../log-capture');
var File = require('gulp-util').File;
var path = require('path');


describe('Log buffer', function() {
	var obj;
	var buffer;
	var originalLog;

	
	beforeEach(function() {
		originalLog = sinon.spy();
		obj = {
			log : originalLog
		};
		buffer = new logCapture.LogBuffer(obj, 'log');
		sinon.spy(buffer, 'log');
	});
	
	afterEach(function() {
		buffer.revert();
		logCapture.stop();
	});
	
	it('should monkey patch the logging function', function() {
		expect(obj.log).not.to.equal(originalLog);
	});
	
	it('should call the original log function and the patched log function', function() {
		obj.log('test');
		expect(originalLog.calledWith('test')).to.be.true;
		expect(buffer.log.calledWith('test')).to.be.true;
	});
	
	it('should store the log in its buffer and knows the caller', function() {
		obj.log('test');
		expect(buffer.data.spy).to.be.equal('test');
	});
	
	it('should append data to an existing buffer', function() {
		obj.log('test');
		obj.log('test');
		expect(buffer.data.spy).to.be.equal('testtest');
	});
	
	it('should restore the logging function to its original function', function() {
		buffer.revert();
		expect(obj.log).to.equal(originalLog);
	});
	
	it('should know its capturing object and function name', function() {
		expect(buffer.hasObj(obj, 'log')).to.be.true;
	});
	
	it('should create a log file from the buffer', function() {
		obj.log('test');
		var f = new File({
			cwd : 'test',
			base : 'test/'
		});
		f.path = '/foo/bar/quux.js';
		var files = buffer.createLogFilesForFile(f, 'hdgl');
		expect(files.length).to.be.equal(1);
		expect(files[0].contents.toString()).to.be.equal('test');
		expect(files[0].path).to.be.equal('test/quux-spy-log.hdgl');
	});
});