import { Formatter, Status, formatterHelpers } from 'cucumber';
import getColorFns from 'cucumber/lib/formatter/get_color_fns';

export default class TeamCityFormatter extends Formatter {
    constructor(options) {
        // turn off colours in formatted errors.
        super(Object.assign(options, { colorFns: getColorFns(false) }));

        options.eventBroadcaster
            .on('test-case-started', ::this.logTestCaseStarted)
            .on('test-case-finished', ::this.logTestCaseFinished);
    }

    getCaseIndexInfo({ sourceLocation, gherkinDocument }) {
        const totalCases = gherkinDocument.feature.children.length;
        const caseIndex = gherkinDocument.feature.children.findIndex(
            child => child.location.line === sourceLocation.line
        );

        return { totalCases, caseIndex };
    }

    logTestSuiteStartedIfFirstTestCase({ sourceLocation, gherkinDocument }) {
        const { caseIndex } = this.getCaseIndexInfo({ sourceLocation, gherkinDocument });

        if (caseIndex === 0) {
            this.log(`##teamcity[testSuiteStarted name='${this.escape(gherkinDocument.feature.name)}']\n`);
        }
    }

    logTestCaseStarted({ sourceLocation }) {
        const { gherkinDocument, pickle: { name: pickleName } } = this.eventDataCollector.getTestCaseData(sourceLocation);

        this.logTestSuiteStartedIfFirstTestCase({ sourceLocation, gherkinDocument });

        this.log(
            `##teamcity[testStarted name='${this.escape(pickleName)}' captureStandardOutput='true']\n`
        );
    }

    logTestSuiteFinishedIfLastTestCase({ sourceLocation, gherkinDocument }) {
        const { totalCases, caseIndex } = this.getCaseIndexInfo({ sourceLocation, gherkinDocument });

        if (caseIndex === totalCases - 1) {
            this.log(`##teamcity[testSuiteFinished name='${this.escape(gherkinDocument.feature.name)}']\n`);
        }
    }

    logTestCaseFinished({ sourceLocation }) {
        const {
            gherkinDocument,
            pickle,
            testCase,
            testCase: { result: { status, duration } }
        } = this.eventDataCollector.getTestCaseData(sourceLocation);

        if (status === Status.AMBIGUOUS || status === Status.FAILED) {
            const details = formatterHelpers.formatIssue({
                colorFns: this.colorFns,
                gherkinDocument,
                number: 1,
                pickle,
                snippetBuilder: this.snippetBuilder,
                testCase
            });

            this.log(
                `##teamcity[testFailed name='${this.escape(pickle.name)}' message='${this.escape(
                    `${pickle.name} FAILED`
                )}' details='${this.escape(details)}']\n`
            );
        }

        this.log(`##teamcity[testFinished name='${this.escape(pickle.name)}' duration='${duration}']\n`);

        this.logTestSuiteFinishedIfLastTestCase({ sourceLocation, gherkinDocument });
    }

    escape(text) {
        return text
            .replace(/\|/g, '||')
            .replace(/'/g, '|\'')
            .replace(/\n/g, '|n')
            .replace(/\r/g, '|r')
            .replace(/\[/g, '|[')
            .replace(/\]/g, '|]');
    }
}
