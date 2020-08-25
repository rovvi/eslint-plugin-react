/**
 * @fileoverview Prevent adjacent inline elements not separated by whitespace.
 * @author Sean Hayes
 */

'use strict';

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

// https://developer.mozilla.org/en-US/docs/Web/HTML/Inline_elements
const inlineNames = [
  'a',
  'b',
  'big',
  'i',
  'small',
  'tt',
  'abbr',
  'acronym',
  'cite',
  'code',
  'dfn',
  'em',
  'kbd',
  'strong',
  'samp',
  'time',
  'var',
  'bdo',
  'br',
  'img',
  'map',
  'object',
  'q',
  'script',
  'span',
  'sub',
  'sup',
  'button',
  'input',
  'label',
  'select',
  'textarea'
];
// Note: raw &nbsp; will be transformed into \u00a0.
const whitespaceRegex = /(?:^\s|\s$)/;

function isInline(node) {
  if (node.type === 'Literal') {
    // Regular whitespace will be removed.
    const value = node.value;
    // To properly separate inline elements, each end of the literal will need
    // whitespace.
    return !whitespaceRegex.test(value);
  }
  if (node.type === 'JSXElement' && inlineNames.indexOf(node.openingElement.name.name) > -1) {
    return true;
  }
  if (node.type === 'CallExpression' && inlineNames.indexOf(node.arguments[0].value) > -1) {
    return true;
  }
  return false;
}

const ERROR = 'Child elements which render as inline HTML elements should be separated by a space or wrapped in block level elements.';

// ------------------------------------------------------------------------------
// Rule Definition
// ------------------------------------------------------------------------------

module.exports = {
  ERROR,
  meta: {
    docs: {
      description: 'Prevent adjacent inline elements not separated by whitespace.',
      category: 'Best Practices',
      recommended: false
    },
    schema: []
  },
  create(context) {
    function validate(node, children) {
      let currentIsInline = false;
      let previousIsInline = false;
      if (!children) {
        return;
      }
      for (let i = 0; i < children.length; i++) {
        currentIsInline = isInline(children[i]);
        if (previousIsInline && currentIsInline) {
          context.report({
            node,
            message: ERROR
          });
          return;
        }
        previousIsInline = currentIsInline;
      }
    }
    return {
      JSXElement(node) {
        validate(node, node.children);
      },
      CallExpression(node) {
        if (!node.callee || node.callee.type !== 'MemberExpression' || node.callee.property.name !== 'createElement') {
          return;
        }
        if (node.arguments.length < 2 || !node.arguments[2]) {
          return;
        }
        const children = node.arguments[2].elements;
        validate(node, children);
      }
    };
  }
};