import { Box, Button, Flex, Heading, Spinner, Text, useColorModeValue } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import Post from "../components/Post";
import { useRecoilState, useSetRecoilState } from "recoil";
import postsAtom from "../atoms/postsAtom";
import userAtom from "../atoms/userAtom";
import SuggestedUsers from "../components/SuggestedUsers";

const HomePage = () => {
	const [posts, setPosts] = useRecoilState(postsAtom);
	const [loading, setLoading] = useState(true);
	const showToast = useShowToast();
	const setUser = useSetRecoilState(userAtom);
	useEffect(() => {
		const getFeedPosts = async () => {
			setLoading(true);
			setPosts([]);
			try {
				const res = await fetch("/api/posts/feed");
				const data = await res.json();
				if (data.error) {
					if (res.status === 401 || data.error.includes("Unauthorized")) {
						localStorage.removeItem("user-threads");
						setUser(null);
						showToast("Session Expired", "Please log in again.", "error");
						return;
					}
					showToast("Error", data.error, "error");
					return;
				}
				console.log(data);
				setPosts(data);
			} catch (error) {
				showToast("Error", error.message, "error");
			} finally {
				setLoading(false);
			}
		};
		getFeedPosts();
	}, [showToast, setPosts]);

	const cardBg = useColorModeValue("white", "gray.dark");
	const cardBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.200");

	return (
		<Flex gap='10' alignItems={"flex-start"}>
			<Box flex={70}>
				{!loading && posts.length === 0 && (
					<Box
						bg={cardBg}
						borderWidth='1px'
						borderColor={cardBorder}
						borderRadius='2xl'
						p={8}
						textAlign='center'
						mb={6}
					>
						<Heading size='md' mb={2}>
							Your feed is quiet
						</Heading>
						<Text fontSize='sm' color='gray.light' mb={4}>
							Follow a few people to start seeing posts here.
						</Text>
						<Button size='sm' variant='solid'>
							Explore suggested users
						</Button>
					</Box>
				)}

				{loading && (
					<Flex justify='center'>
						<Spinner size='xl' />
					</Flex>
				)}

				{posts.map((post) => (
					<Post key={post._id} post={post} postedBy={post.postedBy} />
				))}
			</Box>
			<Box
				flex={30}
				display={{
					base: "none",
					md: "block",
				}}
			>
				<SuggestedUsers />
			</Box>
		</Flex>
	);
};

export default HomePage;
