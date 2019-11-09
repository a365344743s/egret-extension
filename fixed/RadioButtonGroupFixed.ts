/**
 * 修正 RadioButtonGroup.selectedValue = 0 无法正确选中 RadioButton 的 bug
 * see https://github.com/egret-labs/egret-core/pull/189
 **/
namespace eui {
	export function breadthOrderCompare(a:egret.DisplayObject, b:egret.DisplayObject):number {
		let aParent = a.parent;
		let bParent = b.parent;

		if (!aParent || !bParent)
			return 0;

		let aNestLevel = a.$nestLevel;
		let bNestLevel = b.$nestLevel;

		let aIndex = 0;
		let bIndex = 0;

		if (aParent == bParent) {
			aIndex = aParent.getChildIndex(a);
			bIndex = bParent.getChildIndex(b);
		}

		if (aNestLevel > bNestLevel || aIndex > bIndex)
			return 1;
		if (aNestLevel < bNestLevel || bIndex > aIndex)
			return -1;
		if (a == b)
			return 0;
		return breadthOrderCompare(aParent, bParent);
	}
}

eui.RadioButtonGroup.prototype.$addInstance = function(instance: eui.RadioButton):void {
	instance.addEventListener(egret.Event.REMOVED_FROM_STAGE, this.removedHandler, this);
	let buttons = this.radioButtons;
	buttons.push(instance);
	buttons.sort(eui.breadthOrderCompare);
	let length = buttons.length;
	for (let i = 0; i < length; i++) {
		buttons[i].$indexNumber = i;
	}
	if (this._selectedValue != null)
		this.selectedValue = this._selectedValue;
	if (instance.selected == true)
		this.selection = instance;

	instance.$radioButtonGroup = this;
	instance.invalidateState();
}