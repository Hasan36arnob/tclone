import { Box, Button, Flex, Image, Link, useColorMode, useColorModeValue } from "@chakra-ui/react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import userAtom from "../atoms/userAtom";
import { AiFillHome } from "react-icons/ai";
import { RxAvatar } from "react-icons/rx";
import { Link as RouterLink } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import useLogout from "../hooks/useLogout";
import authScreenAtom from "../atoms/authAtom";
import { BsFillChatQuoteFill } from "react-icons/bs";
import { MdOutlineSettings } from "react-icons/md";

const Header = () => {
	const { colorMode, toggleColorMode } = useColorMode();
	const user = useRecoilValue(userAtom);
	const logout = useLogout();
	const setAuthScreen = useSetRecoilState(authScreenAtom);

	const barBg = useColorModeValue("white", "blackAlpha.800");
	const barBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.200");

	return (
		<Box
			mt={4}
			mb={8}
			borderBottomWidth='1px'
			borderColor={barBorder}
			position='sticky'
			top={0}
			zIndex={10}
			bg={barBg}
			backdropFilter='blur(8px)'
		>
		<Flex justifyContent={"space-between"} alignItems="center" py={3}>
			{user && (
				<Link as={RouterLink} to='/'>
					<AiFillHome size={24} />
				</Link>
			)}
			{!user && (
				<Link as={RouterLink} to={"/auth"} onClick={() => setAuthScreen("login")}>
					Assalamu Alaikum
				</Link>
			)}

			<Image
				cursor={"pointer"}
				alt='logo'
				w={7}
				src={colorMode === "dark" ? "/light-logo.svg" : "/dark-logo.svg"}
				onClick={toggleColorMode}
			/>

			{user && (
				<Flex alignItems={"center"} gap={4}>
					<Link as={RouterLink} to={`/${user.username}`}>
						<RxAvatar size={24} />
					</Link>
					<Link as={RouterLink} to={`/chat`}>
						<BsFillChatQuoteFill size={20} />
					</Link>
					<Link as={RouterLink} to={`/settings`}>
						<MdOutlineSettings size={20} />
					</Link>
					<Button size={"xs"} variant="outline" onClick={logout}>
						<FiLogOut size={16} />
					</Button>
				</Flex>
			)}

			{!user && (
				<Link as={RouterLink} to={"/auth"} onClick={() => setAuthScreen("signup")}>
					Join Umma
				</Link>
			)}
		</Flex>
		</Box>
	);
};

export default Header;
