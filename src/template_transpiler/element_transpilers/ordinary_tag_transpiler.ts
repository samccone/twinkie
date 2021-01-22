/**
 * @license
 * Copyright (C) 2020 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {CheerioElementType} from '../../utils';
import {
  AttributeValueType,
  ElementTranspiler,
  TemplateTranspiler,
} from '../transpiler';
import {CodeBuilder} from '../code_builder';
import {HTMLTagAttributes} from '../attributes';
import {kebabCaseToCamelCase} from '../../printer';
import {
  DeclaredPolymerPropertyType,
  PolymerPropertyInfo,
} from '../../ts_code_parser/polymer_classes_parser';
import {SourceFile} from 'typescript';

export type AttributeFilter = (attrName: string, attrValue: string) => boolean;

function getActualTsValue(
  attrRawValue: string,
  tsExpression: string,
  propertyInfo: PolymerPropertyInfo
): string {
  const polymerType = propertyInfo.declaredPolymerPropertyType;
  if (polymerType === DeclaredPolymerPropertyType.Boolean) {
    return attrRawValue === '' || attrRawValue === 'true' ? 'true' : 'false';
  }
  if (polymerType === DeclaredPolymerPropertyType.Number) {
    const number = Number(attrRawValue);
    return isNaN(number) ? tsExpression : number.toString();
  }
  return tsExpression;
}

export class OrdinaryTagTranspiler implements ElementTranspiler {
  canTranspile(element: CheerioElement): boolean {
    return element.type === CheerioElementType.Tag;
  }

  transpile(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    file: SourceFile,
    element: CheerioElement
  ): void {
    this.transpileTagWithoutChildren(transpiler, builder, element);
    // Transpile child elements
    transpiler.transpile(file, element.childNodes);
  }

  protected getActualTagName(element: CheerioElement) {
    if (element.attribs['is']) {
      return element.attribs['is'];
    }
    return element.tagName;
  }

  protected transpileTagWithoutChildren(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    element: CheerioElement,
    attrFilter?: AttributeFilter
  ) {
    builder.beginElement(this.getActualTagName(element));
    for (const [attrName, attrValue] of Object.entries(element.attribs)) {
      if (attrName === 'is') continue;
      if (attrFilter && !attrFilter(attrName, attrValue)) continue;
      this.transpileAttribute(
        transpiler,
        builder,
        element,
        attrName,
        attrValue
      );
    }
    builder.endElement();
  }

  private isHtmlAttribute(element: CheerioElement, attrName: string): boolean {
    if (HTMLTagAttributes[this.getActualTagName(element)]?.[attrName]) {
      return true;
    }
    return !!HTMLTagAttributes['*']?.[attrName];
  }

  protected transpileAttribute(
    transpiler: TemplateTranspiler,
    builder: CodeBuilder,
    element: CheerioElement,
    attrName: string,
    attrValue: string
  ) {
    const eventAttrPrefix = 'on-';
    if (attrName.startsWith(eventAttrPrefix)) {
      const eventName = attrName.slice(eventAttrPrefix.length);
      builder.subscribeEvent(
        eventName,
        attrValue,
        transpiler.getCurrentContext()
      );
      return;
    }
    const elementsProperties = transpiler.getElementProperties(
      this.getActualTagName(element)
    );

    const tsValue = transpiler.transpileAttributeValue(attrValue);
    const assignToAttribute = attrName.endsWith('$');
    if (assignToAttribute) {
      if (!tsValue.whitespacesOnly) {
        builder.addAttributeSet(
          attrName.slice(0, -1),
          tsValue.stringExpression
        );
      }
    } else if (this.isHtmlAttribute(element, attrName)) {
      if (!tsValue.whitespacesOnly) {
        builder.addAttributeSet(attrName, tsValue.stringExpression);
      }
    } else {
      if (tsValue.attrValueType === AttributeValueType.TextOnly) {
        const propertyName = kebabCaseToCamelCase(attrName);
        const propertyInfo = elementsProperties?.get(propertyName);
        if (propertyInfo) {
          builder.addElementPropertySet(
            attrName,
            getActualTsValue(attrValue, tsValue.tsExpression, propertyInfo)
          );
        }
      } else {
        builder.addElementPropertySet(attrName, tsValue.tsExpression);
      }
    }
    if (tsValue.attrValueType === AttributeValueType.TwoWayBinding) {
      if (!transpiler.getCurrentContext().localVars.has(tsValue.tsExpression)) {
        builder.addValueSetFromProperty(
          this.getActualTagName(element),
          tsValue.reverseBindingExpression,
          attrName,
          tsValue.negotiation,
          transpiler
        );
      }
    }
  }
}
