import WidgetBase from "@dojo/framework/widget-core/WidgetBase";
import renderer from "@dojo/framework/widget-core/vdom";
import Select from "./widgets/Select";
import { v, w } from "@dojo/framework/widget-core/d";

const options = [
	{
		label: "",
		value: "",
		disabled: true
	},
	{
		label: "Option 1",
		value: "option1"
	},
	{
		label: "Option 2",
		value: "option2"
	},
	{
		label: "Option 3",
		value: "option3"
	}
];

class App extends WidgetBase {
	protected render() {
		return v("div", [
			w(Select, {
				label: "Native",
				options
			})
		]);
	}
}

const r = renderer(() => w(App, {}));
r.mount();
