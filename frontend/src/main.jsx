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
				bg: mode("gray.100", "#0a1a0a")(props),
			},
		}),
	},
	colors: {
		brand: {
			50: "#e8f5e9",
			100: "#c8e6c9",
			200: "#a5d6a7",
			300: "#81c784",
			400: "#4caf50",
			500: "#2e7d32",
			600: "#1b5e20",
			700: "#145214",
			800: "#0d380d",
			900: "#081f08",
		},
		gold: {
			50: "#fff8e1",
			100: "#ffecb3",
			200: "#ffe082",
			300: "#ffd54f",
			400: "#ffca28",
			500: "#ffc107",
			600: "#ffb300",
			700: "#ffa000",
			800: "#ff8f00",
			900: "#ff6f00",
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
