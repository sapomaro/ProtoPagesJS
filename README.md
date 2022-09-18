# ProtoPagesJS v0.0.1a

## Dynamic template builder for the web powered by JavaScript

Examples of usage:

	<!-- HTML PART -->
	<body>
	
	<!-- Example 1: Wrap your variables with %{ }% -->
	<div style="color: %{color}%">%{text}% %{color}%!</div>
	
	<!-- Example 2: Each of your partials (components with HTML tags)
		 should be wrapped in an HTML element (later this will be improved) -->
	<div>%{ Partial }%</div>
	
	<!-- Example 3: Add parentheses with JSON after your element to pass properties
		 (you should use double quotes for properties and text values) -->
	<div>%{ FancyLink({ "text": "Click me", "url": "/" }) }%</div>
	
	<!-- Example 4: Add '...' after array bracket ']'
		 to create a set of cloned elements with custom values -->
	<div>%{ MultiButton([
			{"value": 1}, 
			{"value": 2}, 
			{"value": 3} ]...) }%</div>
	
	<!-- Example 5 -->
	<div>%{ MultiButtonWrapper }%</div>
	
	
	<script type="module">
	
		// JS PART 
		
		import ProtoPages from './ProtoPages.js';
		
		const context = {
			// Example 1:
			text: 'It must be...',
			color: 'red',
			
			// Example 2: Define function to tell ProtoPages to compile HTML tags 
			Partial: () => `<b>Some component with HTML tags</b>`,
			
			// Example 3: You can use arguments with literals '${}',
			FancyLink: (props) => `<a href="${props.url}">${props.text}</a>`,
			
			// Example 4:
			MultiButton: (props) => `<button>${props.value}</button>` 
		};	
		
		// Example 5: Wrap templates in other templates.
		// You can separate your JSON and templates like this for readability:
		const data = JSON.stringify([
			{"value": 1}, 
			{"value": 2}, 
			{"value": 3}, 
			{"value": 4}, 
			{"value": 5}
		]);
		context.MultiButtonWrapper = `%{ MultiButton(${data}...) }%`;
		
		ProtoPages.compile(context);
		
	</script>
	
	</body>