The template_transpile generates a typescript code from the polymer template.

* element_transpilers subdirectory contains a transpilers for different built-in
  tags
* code_builder.ts provides a methods for generating a well-formatted code
* class TemplateTranspiler (transpiler.ts) recursively transpile a parsed
  HTML element.
* output_template defines a template for a file. It contains some utility
  functions which requires for correct typechecking by the typescript compiler.
  
For example, the following elements:
```html
<template is="dom-repeat" items="{{_permissions}}" as="permission">
  <gr-permission
    name="[[_computePermissionName(section.id, permission, capabilities)]]"
    permission="{{permission}}"
    labels="[[labels]]"
    section="[[section.id]]"
    editing="[[editing]]"
    groups="[[groups]]"
    on-added-permission-removed="_handleAddedPermissionRemoved"
  >
  </gr-permission>
</template>
```
are transpiled to:
```typescript
{
  const index = 0;
  const itemsIndexAs = 0;
  useVars(index, itemsIndexAs); //Avoid 'not-used' error for variables
  for(const permission of this._permissions!)
  {
    {
      const el: HTMLElementTagNameMap['gr-permission'] = null!;
      useVars(el);
      el.name = this._computePermissionName(__f(this.section)!.id, permission, this.capabilities);
      el.permission = permission;
      el.labels = this.labels;
      el.section = __f(this.section)!.id; // __f is a special function to handle union types correctly
      el.editing = this.editing;
      el.groups = this.groups;
      el.addEventListener('added-permission-removed', e => this._handleAddedPermissionRemoved.bind(this, wrapInPolymerDomRepeatEvent(e, permission))());
    }
  }
}
``` 
