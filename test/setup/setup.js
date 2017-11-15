module.exports = function(root, testSuite) {
    root = root || global;
    root.expect = root.chai.expect;
    testSuite = testSuite || root;

    testSuite.beforeEach(() => {
        root.sandbox = root.sinon.sandbox.create();
        root.stub = root.sandbox.stub.bind(root.sandbox);
        root.spy = root.sandbox.spy.bind(root.sandbox);
        root.mock = root.sandbox.mock.bind(root.sandbox);
        root.useFakeTimers = root.sandbox.useFakeTimers.bind(root.sandbox);
        root.useFakeXMLHttpRequest = root.sandbox.useFakeXMLHttpRequest.bind(root.sandbox);
        root.useFakeServer = root.sandbox.useFakeServer.bind(root.sandbox);
    });

    testSuite.afterEach(() => {
        delete root.stub;
        delete root.spy;
        root.sandbox.restore();
    });
};
