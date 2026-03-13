import { Box, Container, Spinner, Center } from "@chakra-ui/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useRecoilValue } from "recoil";
import userAtom from "./atoms/userAtom";
import Header from "./components/Header";
import CreatePost from "./components/CreatePost";

// Lazy load pages for better performance & scalability
const UserPage = lazy(() => import("./pages/UserPage"));
const PostPage = lazy(() => import("./pages/PostPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const UpdateProfilePage = lazy(() => import("./pages/UpdateProfilePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

// Loading spinner with Islamic green theme
const LoadingFallback = () => (
	<Center py={10}>
		<Spinner size="xl" color="brand.500" thickness="4px" />
	</Center>
);

function App() {
	const user = useRecoilValue(userAtom);
	const { pathname } = useLocation();
	
	return (
		<Box position={"relative"} w='full'>
			<Container maxW={pathname === "/" ? { base: "620px", md: "900px" } : "620px"}>
				<Header />
				{user && pathname !== "/auth" && <CreatePost />}
				<Routes>
					<Route path='/' element={user ? <Suspense fallback={<LoadingFallback />}><HomePage /></Suspense> : <Navigate to='/auth' />} />
					<Route path='/auth' element={!user ? <AuthPage /> : <Navigate to='/' />} />
					<Route path='/update' element={user ? <Suspense fallback={<LoadingFallback />}><UpdateProfilePage /></Suspense> : <Navigate to='/auth' />} />

					<Route
						path='/:username'
						element={
							<Suspense fallback={<LoadingFallback />}>
								<UserPage />
							</Suspense>
						}
					/>
					<Route path='/:username/post/:pid' element={<Suspense fallback={<LoadingFallback />}><PostPage /></Suspense>} />
					<Route path='/chat' element={user ? <Suspense fallback={<LoadingFallback />}><ChatPage /></Suspense> : <Navigate to={"/auth"} />} />
					<Route path='/settings' element={user ? <Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense> : <Navigate to={"/auth"} />} />
				</Routes>
			</Container>
		</Box>
	);
}

export default App;
