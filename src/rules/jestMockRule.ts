import { isCallExpression, isPropertyAccessExpression, isIdentifier, isStringLiteral } from "tsutils";
import * as ts from "typescript";

import * as Lint from "tslint";

interface Option {
    pattern: RegExp;
    message?: string;
}

export class Rule extends Lint.Rules.AbstractRule {
    public static failureString = "jest.mock requires a type argument";

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithFunction(sourceFile, walk, this.ruleArguments);
    }
}

function walk(ctx: Lint.WalkContext<Option[]>) {
    return ts.forEachChild(ctx.sourceFile, function cb(node: ts.Node): void {
        if (isCallExpression(node)
            && node.typeArguments === undefined && node.arguments.length >= 2
        ) {
            const fisrtArgument = node.arguments[0];
            const leftHandExpression = node.expression;
            if (isStringLiteral(fisrtArgument)
                && isPropertyAccessExpression(leftHandExpression)
                && isIdentifier(leftHandExpression.expression)
                && isIdentifier(leftHandExpression.name)
                && leftHandExpression.expression.text === "jest"
                && leftHandExpression.name.text === "mock"
            ) {
                ctx.addFailureAt(
                    leftHandExpression.end,
                    0,
                    Rule.failureString,
                    Lint.Replacement.appendText(leftHandExpression.end, `<typeof import(${fisrtArgument.getText()})>`),
                );
            }
        }
        return ts.forEachChild(node, cb);
    });
}
