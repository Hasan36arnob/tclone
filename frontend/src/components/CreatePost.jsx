import { AddIcon } from "@chakra-ui/icons";
import {
	Button,
	CloseButton,
	Flex,
	FormControl,
	Image,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Text,
	Textarea,
	useColorModeValue,
	useDisclosure,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import usePreviewImg from "../hooks/usePreviewImg";
import { BsFillImageFill } from "react-icons/bs";
import { useRecoilState, useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import useShowToast from "../hooks/useShowToast";
import postsAtom from "../atoms/postsAtom";
import { useLocation, useParams } from "react-router-dom";

const MAX_CHAR = 500;

const CreatePost = () => {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [postText, setPostText] = useState("");
	const imageRef = useRef(null);
	const [mediaFile, setMediaFile] = useState(null);
	const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
	const [remainingChar, setRemainingChar] = useState(MAX_CHAR);
	const user = useRecoilValue(userAtom);
	const showToast = useShowToast();
	const [loading, setLoading] = useState(false);
	const [posts, setPosts] = useRecoilState(postsAtom);
	const { username } = useParams();
	const { pathname } = useLocation();

	const handleTextChange = (e) => {
		const inputText = e.target.value;

		if (inputText.length > MAX_CHAR) {
			const truncatedText = inputText.slice(0, MAX_CHAR);
			setPostText(truncatedText);
			setRemainingChar(0);
		} else {
			setPostText(inputText);
			setRemainingChar(MAX_CHAR - inputText.length);
		}
	};

	const handleCreatePost = async () => {
		setLoading(true);
		try {
			const form = new FormData();
			form.append("postedBy", user._id);
			form.append("text", postText);
			if (mediaFile) form.append("media", mediaFile);

			const res = await fetch("/api/posts/create", { method: "POST", body: form });

			const data = await res.json();
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}
			showToast("Success", "Post created successfully", "success");
			if (pathname === "/" || username === user.username) {
				setPosts([data, ...posts]);
			}
			onClose();
			setPostText("");
			if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
			setMediaPreviewUrl(null);
			setMediaFile(null);
		} catch (error) {
			showToast("Error", error, "error");
		} finally {
			setLoading(false);
		}
	};

	const handleMediaChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const isImage = file.type.startsWith("image/");
		const isVideo = file.type.startsWith("video/");
		if (!isImage && !isVideo) {
			showToast("Invalid file type", "Please select an image or video file", "error");
			return;
		}

		// Keep it simple: 25MB cap for dev to avoid giant payloads.
		const maxBytes = 25 * 1024 * 1024;
		if (file.size > maxBytes) {
			showToast("File too large", "Please choose a file under 25MB", "error");
			return;
		}

		if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
		setMediaFile(file);
		setMediaPreviewUrl(URL.createObjectURL(file));
	};

	return (
		<>
			<Button
				position={"fixed"}
				bottom={10}
				right={5}
				bg={useColorModeValue("gray.300", "gray.dark")}
				onClick={onOpen}
				size={{ base: "sm", sm: "md" }}
			>
				<AddIcon />
			</Button>

			<Modal isOpen={isOpen} onClose={onClose}>
				<ModalOverlay />

				<ModalContent>
					<ModalHeader>Create Post</ModalHeader>
					<ModalCloseButton />
					<ModalBody pb={6}>
						<FormControl>
							<Textarea
								placeholder='Post content goes here..'
								onChange={handleTextChange}
								value={postText}
							/>
							<Text fontSize='xs' fontWeight='bold' textAlign={"right"} m={"1"} color={"gray.800"}>
								{remainingChar}/{MAX_CHAR}
							</Text>

							<Input
								type='file'
								hidden
								ref={imageRef}
								accept='image/*,video/*'
								onChange={handleMediaChange}
							/>

							<BsFillImageFill
								style={{ marginLeft: "5px", cursor: "pointer" }}
								size={16}
								onClick={() => imageRef.current.click()}
							/>
						</FormControl>

						{mediaPreviewUrl && (
							<Flex mt={5} w={"full"} position={"relative"}>
								{mediaFile?.type?.startsWith("video/") ? (
									<Box as='video' src={mediaPreviewUrl} controls style={{ width: "100%", borderRadius: 8 }} />
								) : (
									<Image src={mediaPreviewUrl} alt='Selected media' />
								)}
								<CloseButton
									onClick={() => {
										if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
										setMediaPreviewUrl(null);
										setMediaFile(null);
									}}
									bg={"gray.800"}
									position={"absolute"}
									top={2}
									right={2}
								/>
							</Flex>
						)}
					</ModalBody>

					<ModalFooter>
						<Button colorScheme='blue' mr={3} onClick={handleCreatePost} isLoading={loading}>
							Post
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
};

export default CreatePost;
