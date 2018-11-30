import WidgetBase from '@dojo/framework/widget-core/WidgetBase';
import renderer from '@dojo/framework/widget-core/vdom';
import Select from './widgets/Select';
import { v, w } from '@dojo/framework/widget-core/d';

const options = [
	{
		label: 'Cake',
		value: 'cake'
	},
	{
		label: 'Pie',
		value: 'pie'
	},
	{
		label: 'Candy',
		value: 'candy'
	},
	{
		label: 'Broccoli',
		value: 'broccoli'
	}
];

class App extends WidgetBase {
	private _value = '';
	private _inFocus = false;

	protected render() {
		return v('div', [
			v('div', { classes: 'flexRow'}, [
				w(Select, {
					label: 'Food',
					options,
					value: this._value,
					onValue: (value: string) => {
						this._value = value;
						this.invalidate();
					}
				})
			]),
			v('div', { classes: 'flexRow' }, [
				w(Select, {
					label: 'Disabled',
					options,
					disabled: true
				})
			]),
			v('div', {classes: 'flexRow'}, [
				w(Select, {
					label: 'Blurs',
					options,
					onFocus: () => { this._inFocus = true; this.invalidate(); },
					onBlur: () => { this._inFocus = false; this.invalidate(); }
				}),
				v('span', {}, [this._inFocus ? "😀" : '☹'])
			]),
			v('div', {classes: 'flexRow'}, [
				w(Select, {
					label: 'Required',
					options,
					required: true
				})
			])
		]);
	}
}

const r = renderer(() => w(App, {}));
r.mount();
