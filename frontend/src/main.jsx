import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";
import { ColorModeScript } from "@chakra-ui/color-mode";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { SocketContextProvider } from "./context/SocketContext.jsx";

const theme = extendTheme({
	config: {
		initialColorMode: "dark",
		useSystemColorMode: true,
	},
	fonts: {
		heading: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
		body: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
	},
	styles: {
		global: (props) => ({
			body: {
				color: mode("gray.800", "whiteAlpha.900")(props),
				bg: mode("gray.100", "#050509")(props),
			},
		}),
	},
	colors: {
		brand: {
			50: "#e3f2ff",
			100: "#b3d4ff",
			200: "#81b6ff",
			300: "#4f97ff",
			400: "#287dff",
			500: "#0f63e6",
			600: "#084db4",
			700: "#053882",
			800: "#022250",
			900: "#000f26",
		},
		gray: {
			light: "#848484",
			dark: "#151515",
		},
	},
	components: {
		Button: {
			defaultProps: {
				colorScheme: "brand",
				borderRadius: "full",
			},
		},
		Card: {
			baseStyle: {
				borderRadius: "2xl",
				boxShadow: "lg",
			},
		},
	},
});

ReactDOM.createRoot(document.getElementById("root")).render(
	// React.StrictMode renders every component twice (in the initial render), only in development.
	<React.StrictMode>
		<RecoilRoot>
			<BrowserRouter>
				<ChakraProvider theme={theme}>
					<ColorModeScript initialColorMode={theme.config.initialColorMode} />
					<SocketContextProvider>
						<App />
					</SocketContextProvider>
				</ChakraProvider>
			</BrowserRouter>
		</RecoilRoot>
	</React.StrictMode>
);
