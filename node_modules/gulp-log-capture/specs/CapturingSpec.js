var expect = require('chai').expect;
var sinon  = require('sinon');
var logCapture = require('../log-capture');
var File = require('gulp-util').File;
var through = require('through2');


describe('capturing', function() {
	var throughObjStub;
	var throughObj = [];
	var throughCb = [];
	var testFile;
	var obj;
	var throughStubs = 3;
	
	beforeEach(function() {
		obj = {
			log : sinon.spy()
		}
		throughObjStub = sinon.stub(through, 'obj');
		testFile = new File();
		for(var i = 0; i < throughStubs; i++) {
			throughObj.push({push : sinon.spy()});
			throughCb.push(sinon.spy());
			throughObjStub.onCall(i).yieldsOn(throughObj[i], testFile, 'uitf-8', throughCb[i]);
		}
		throughObjStub.yieldsOn({push : function(){}}, testFile, 'utf-8', function() {});
	});
	
	afterEach(function() {
		logCapture.stop();
		throughObjStub.restore();
	});
	
	it('should add another buffer for a differnt logging object', function(){
			var anotherObj = {
				log2 : function() {}
			}
			logCapture.start(obj, 'log');
			logCapture.start(anotherObj, 'log2');
			expect(logCapture.buffers.length).to.be.equal(2);
	});
	
	it('should reuse the same buffer for the same object and log function', function(){
			logCapture.start(obj, 'log');
			logCapture.start(obj, 'log');
			expect(logCapture.buffers.length).to.be.equal(1);
	});
	
	it('should start the capturing', function() {
		logCapture.start(obj, 'log');
		expect(logCapture.buffers.length).to.be.equal(1);
		expect(throughCb[0].called).to.be.true;
		expect(throughObj[0].push.calledWith(testFile)).to.be.true;
	});
	
	it('should stop the capturing process', function() {
		logCapture.start(obj, 'log');
		obj.log('test');
		logCapture.stop();
		expect(logCapture.buffers.length).to.be.equal(0);
		expect(throughCb[1].called).to.be.true;
		expect(throughObj[1].push.called).to.be.true;
	});
	
	it('should not allow concurrent capturing', function() {
		var a = function() {
			logCapture.start(obj, 'log');	
		};
		var b = function() {
			logCapture.start(obj, 'log');
		};
		
		a();
		expect(b).to.throw(/Concurrent capturing is not supported/);
	});
	
	it('should restore the files in the pipe prior capturing end', function() {
		logCapture.start(obj, 'log');
		obj.log('test');
		logCapture.stop();
		logCapture.restore();
		expect(throughCb[2].called).to.be.true;
		expect(throughObj[2].push.calledWith(testFile)).to.be.true;
	});
	
	it('should not restore as long as the capturing was not stopped', function() {
		logCapture.start(obj, 'log');
		obj.log('test');
		expect(logCapture.restore).to.throw(/Capturing was not stopped!/);
	});
});