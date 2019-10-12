import TeamCityFormatter from '../../src/cucumber-teamcity-formatter';
import { Status, formatterHelpers } from 'cucumber';
import EventEmitter from 'events';
import Gherkin from 'gherkin';

function getGherkinEvents(...params) {
    const events = Gherkin.generateEvents(...params);
    // clean up after Gherkin.
    delete global.result;
    return events;
}

describe('TeamCityFormatter', function() {
    beforeEach(function() {
        this.eventBroadcaster = new EventEmitter();

        this.output = '';
        const logFn = data => {
            this.output += data
        };

        this.teamCityFormatter = new TeamCityFormatter({
            eventBroadcaster: this.eventBroadcaster,
            eventDataCollector: new formatterHelpers.EventDataCollector(this.eventBroadcaster),
            log: logFn
        });
    });

    describe('no features', function() {
        beforeEach(function() {
            this.eventBroadcaster.emit('test-run-finished');
        });

        it('outputs nothing to output stream', function() {
            expect(this.output).to.eql('');
        });
    });

    describe('one scenario with one step', function() {
        beforeEach(function() {

            const events = getGherkinEvents(
                '@tag1 @tag2\n' +
                    'Feature: my feature\n' +
                    'my feature description\n' +
                    'Scenario: my scenario\n' +
                    'my scenario description\n' +
                    'Given my step',
                'a.feature'
            );

            events.forEach(event => {
                this.eventBroadcaster.emit(event.type, event);
                if (event.type === 'pickle') {
                    this.eventBroadcaster.emit('pickle-accepted', {
                        type: 'pickle-accepted',
                        pickle: event.pickle,
                        uri: event.uri
                    });
                }
            });
            this.testCase = { attemptNumber: 1, sourceLocation: { uri: 'a.feature', line: 4 } };
        });

        describe('passed', function() {
            beforeEach(function() {
                this.eventBroadcaster.emit('test-case-prepared', {
                    sourceLocation: this.testCase.sourceLocation,
                    steps: [
                        {
                            sourceLocation: { uri: 'a.feature', line: 6 }
                        }
                    ]
                });
                this.eventBroadcaster.emit('test-case-started', this.testCase);
                this.eventBroadcaster.emit('test-step-finished', {
                    index: 0,
                    testCase: this.testCase,
                    result: { duration: 1, status: Status.PASSED }
                });
                this.eventBroadcaster.emit('test-case-finished', {
                    ...this.testCase,
                    result: { duration: 1, status: Status.PASSED }
                });
                this.eventBroadcaster.emit('test-run-finished');
            });

            it('outputs the TeamCity markers for the feature and scenario', function() {
                const outputLines = this.output.trim().split(/\r?\n/);
                expect(outputLines.length).to.eql(4);
                expect(outputLines[0]).to.eql('##teamcity[testSuiteStarted name=\'my feature\']');

                expect(outputLines[1]).to.eql('##teamcity[testStarted name=\'my scenario\' captureStandardOutput=\'true\']');
                expect(outputLines[2]).to.eql('##teamcity[testFinished name=\'my scenario\' duration=\'1\']');

                expect(outputLines[3]).to.eql('##teamcity[testSuiteFinished name=\'my feature\']');
            });
        });

        ['failed', 'ambiguous'].map(function(status) {
            describe(`test has ${status} status`, function() {
                beforeEach(function() {
                    this.eventBroadcaster.emit('test-case-prepared', {
                        sourceLocation: this.testCase.sourceLocation,
                        steps: [
                            {
                                sourceLocation: { uri: 'a.feature', line: 6 }
                            }
                        ]
                    });
                    this.eventBroadcaster.emit('test-case-started', this.testCase);
                    this.eventBroadcaster.emit('test-step-finished', {
                        index: 0,
                        testCase: this.testCase,
                        result: { duration: 13, exception: 'my error', status: status }
                    });
                    this.eventBroadcaster.emit('test-case-finished', {
                        ...this.testCase,
                        result: { duration: 15, status: status }
                    });
                    this.eventBroadcaster.emit('test-run-finished');
                });

                it('includes the error message in the TeamCity markers', function() {
                    const outputLines = this.output.trim().split(/\r?\n/);
                    expect(outputLines.length).to.eql(5);
                    expect(outputLines[0]).to.eql('##teamcity[testSuiteStarted name=\'my feature\']');

                    expect(outputLines[1]).to.eql('##teamcity[testStarted name=\'my scenario\' captureStandardOutput=\'true\']');
                    expect(outputLines[2]).to.have.string('##teamcity[testFailed name=\'my scenario\' message=\'my scenario FAILED\' details=\'1) Scenario: my scenario');
                    expect(outputLines[3]).to.eql('##teamcity[testFinished name=\'my scenario\' duration=\'15\']');

                    expect(outputLines[4]).to.eql('##teamcity[testSuiteFinished name=\'my feature\']');
                });
            });
        });
    });

    describe('multiple scenarios with multiple steps', function() {
        beforeEach(function() {

            const events = getGherkinEvents(
                '@tag1 @tag2\n' +
                    'Feature: my feature\n' +
                    'my feature description\n' +
                    'Scenario: my first scenario\n' +
                    'my first scenario description\n' +
                    'Given my first step for my first scenario\n' +
                    'Given my second step for my first scenario\n' +
                    'Scenario: my second scenario\n' +
                    'my second scenario description\n' +
                    'Given my first step for my second scenario\n' +
                    'Given my second step for my second scenario',
                'a.feature'
            );

            events.forEach(event => {
                this.eventBroadcaster.emit(event.type, event);
                if (event.type === 'pickle') {
                    this.eventBroadcaster.emit('pickle-accepted', {
                        type: 'pickle-accepted',
                        pickle: event.pickle,
                        uri: event.uri
                    });
                }
            });
            this.testCase1 = { attemptNumber: 1, sourceLocation: { uri: 'a.feature', line: 4 } };
            this.testCase2 = { attemptNumber: 1, sourceLocation: { uri: 'a.feature', line: 8 } };
        });

        describe('passed', function() {
            beforeEach(function() {
                this.eventBroadcaster.emit('test-case-prepared', {
                    sourceLocation: this.testCase1.sourceLocation,
                    steps: [
                        {
                            sourceLocation: { uri: 'a.feature', line: 6 }
                        },
                        {
                            sourceLocation: { uri: 'a.feature', line: 7 }
                        }
                    ]
                });
                this.eventBroadcaster.emit('test-case-started', this.testCase1);
                this.eventBroadcaster.emit('test-step-finished', {
                    index: 0,
                    testCase: this.testCase1,
                    result: { duration: 1, status: Status.PASSED }
                });
                this.eventBroadcaster.emit('test-step-finished', {
                    index: 1,
                    testCase: this.testCase1,
                    result: { duration: 2, status: Status.PASSED }
                });
                this.eventBroadcaster.emit('test-case-finished', {
                    ...this.testCase1,
                    result: { duration: 3, status: Status.PASSED }
                });

                this.eventBroadcaster.emit('test-case-prepared', {
                    ...this.testCase2,
                    steps: [
                        {
                            sourceLocation: { uri: 'a.feature', line: 10 }
                        },
                        {
                            sourceLocation: { uri: 'a.feature', line: 11 }
                        }
                    ]
                });
                this.eventBroadcaster.emit('test-case-started', this.testCase2);
                this.eventBroadcaster.emit('test-step-finished', {
                    index: 0,
                    testCase: this.testCase2,
                    result: { duration: 4, status: Status.PASSED }
                });
                this.eventBroadcaster.emit('test-step-finished', {
                    index: 1,
                    testCase: this.testCase2,
                    result: { duration: 5, status: Status.PASSED }
                });
                this.eventBroadcaster.emit('test-case-finished', {
                    ...this.testCase2,
                    result: { duration: 9, status: Status.PASSED }
                });

                this.eventBroadcaster.emit('test-run-finished');
            });

            it('outputs the TeamCity markers for the feature and scenario', function() {
                const outputLines = this.output.trim().split(/\r?\n/);
                expect(outputLines.length).to.eql(6);
                expect(outputLines[0]).to.eql('##teamcity[testSuiteStarted name=\'my feature\']');

                expect(outputLines[1]).to.eql('##teamcity[testStarted name=\'my first scenario\' captureStandardOutput=\'true\']');
                expect(outputLines[2]).to.eql('##teamcity[testFinished name=\'my first scenario\' duration=\'3\']');

                expect(outputLines[3]).to.eql('##teamcity[testStarted name=\'my second scenario\' captureStandardOutput=\'true\']');
                expect(outputLines[4]).to.eql('##teamcity[testFinished name=\'my second scenario\' duration=\'9\']');

                expect(outputLines[5]).to.eql('##teamcity[testSuiteFinished name=\'my feature\']');
            });
        });

        describe('skipped', function() {
            beforeEach(function() {
                this.eventBroadcaster.emit('test-case-prepared', {
                    sourceLocation: this.testCase1.sourceLocation,
                    steps: [
                        {
                            sourceLocation: { uri: 'a.feature', line: 6 }
                        },
                        {
                            sourceLocation: { uri: 'a.feature', line: 7 }
                        }
                    ]
                });
                this.eventBroadcaster.emit('test-case-started', this.testCase1);
                this.eventBroadcaster.emit('test-step-finished', {
                    index: 0,
                    testCase: this.testCase1,
                    result: { duration: 1, status: Status.SKIPPED }
                });
                this.eventBroadcaster.emit('test-step-finished', {
                    index: 1,
                    testCase: this.testCase1,
                    result: { duration: 2, status: Status.SKIPPED }
                });
                this.eventBroadcaster.emit('test-case-finished', {
                    ...this.testCase1,
                    result: { duration: 3, status: Status.SKIPPED }
                });

                this.eventBroadcaster.emit('test-case-prepared', {
                    sourceLocation: this.testCase2.sourceLocation,
                    steps: [
                        {
                            sourceLocation: { uri: 'a.feature', line: 10 }
                        },
                        {
                            sourceLocation: { uri: 'a.feature', line: 11 }
                        }
                    ]
                });
                this.eventBroadcaster.emit('test-case-started', this.testCase2);
                this.eventBroadcaster.emit('test-step-finished', {
                    index: 0,
                    testCase: this.testCase2,
                    result: { duration: 4, status: Status.SKIPPED }
                });
                this.eventBroadcaster.emit('test-step-finished', {
                    index: 1,
                    testCase: this.testCase2,
                    result: { duration: 5, status: Status.SKIPPED }
                });
                this.eventBroadcaster.emit('test-case-finished', {
                    ...this.testCase2,
                    result: { duration: 9, status: Status.SKIPPED }
                });

                this.eventBroadcaster.emit('test-run-finished');
            });

            it('outputs the TeamCity markers for the feature and scenario', function() {
                const outputLines = this.output.trim().split(/\r?\n/);
                expect(outputLines.length).to.eql(8);
                expect(outputLines[0]).to.eql('##teamcity[testSuiteStarted name=\'my feature\']');
                expect(outputLines[1]).to.eql('##teamcity[testStarted name=\'my first scenario\' captureStandardOutput=\'true\']');
                expect(outputLines[2]).to.eql('##teamcity[testIgnored name=\'my first scenario\']');
                expect(outputLines[3]).to.eql('##teamcity[testFinished name=\'my first scenario\' duration=\'3\']');

                expect(outputLines[4]).to.eql('##teamcity[testStarted name=\'my second scenario\' captureStandardOutput=\'true\']');
                expect(outputLines[5]).to.eql('##teamcity[testIgnored name=\'my second scenario\']');
                expect(outputLines[6]).to.eql('##teamcity[testFinished name=\'my second scenario\' duration=\'9\']');
                expect(outputLines[7]).to.eql('##teamcity[testSuiteFinished name=\'my feature\']');
            });
        });

        ['failed', 'ambiguous'].map(function(status) {
            describe(`test has ${status} status`, function() {
                beforeEach(function() {
                    this.eventBroadcaster.emit('test-case-prepared', {
                        sourceLocation: this.testCase1.sourceLocation,
                        steps: [
                            {
                                sourceLocation: { uri: 'a.feature', line: 6 }
                            },
                            {
                                sourceLocation: { uri: 'a.feature', line: 7 }
                            }
                        ]
                    });
                    this.eventBroadcaster.emit('test-case-started', this.testCase1);
                    this.eventBroadcaster.emit('test-step-finished', {
                        index: 0,
                        testCase: this.testCase1,
                        result: { duration: 1, status: Status.PASSED }
                    });
                    this.eventBroadcaster.emit('test-step-finished', {
                        index: 1,
                        testCase: this.testCase1,
                        result: { duration: 2, status: Status.PASSED }
                    });
                    this.eventBroadcaster.emit('test-case-finished', {
                        ...this.testCase1,
                        result: { duration: 3, status: Status.PASSED }
                    });

                    this.eventBroadcaster.emit('test-case-prepared', {
                        sourceLocation: this.testCase2.sourceLocation,
                        steps: [
                            {
                                sourceLocation: { uri: 'a.feature', line: 10 }
                            },
                            {
                                sourceLocation: { uri: 'a.feature', line: 11 }
                            }
                        ]
                    });
                    this.eventBroadcaster.emit('test-case-started', this.testCase2);
                    this.eventBroadcaster.emit('test-step-finished', {
                        index: 0,
                        testCase: this.testCase2,
                        result: { duration: 4, status: status, exception: 'something bad' }
                    });
                    this.eventBroadcaster.emit('test-step-finished', {
                        index: 1,
                        testCase: this.testCase2,
                        result: { duration: 5, status: Status.PASSED }
                    });
                    this.eventBroadcaster.emit('test-case-finished', {
                        ...this.testCase2,
                        result: { duration: 9, status: status }
                    });

                    this.eventBroadcaster.emit('test-run-finished');
                });

                it('includes the error message in the TeamCity markers', function() {
                    const outputLines = this.output.trim().split(/\r?\n/);
                    expect(outputLines.length).to.eql(7);
                    expect(outputLines[0]).to.eql('##teamcity[testSuiteStarted name=\'my feature\']');
                    expect(outputLines[1]).to.eql('##teamcity[testStarted name=\'my first scenario\' captureStandardOutput=\'true\']');
                    expect(outputLines[2]).to.eql('##teamcity[testFinished name=\'my first scenario\' duration=\'3\']');

                    expect(outputLines[3]).to.eql('##teamcity[testStarted name=\'my second scenario\' captureStandardOutput=\'true\']');
                    expect(outputLines[4]).to.have.string('##teamcity[testFailed name=\'my second scenario\' message=\'my second scenario FAILED\' details=\'1) Scenario: my second scenario');
                    expect(outputLines[5]).to.eql('##teamcity[testFinished name=\'my second scenario\' duration=\'9\']');
                    expect(outputLines[6]).to.eql('##teamcity[testSuiteFinished name=\'my feature\']');
                });
            });
        });
    });
});
