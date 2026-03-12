import { useToast } from "@chakra-ui/toast";
import { useCallback } from "react";

const useShowToast = () => {
	const toast = useToast();

	const showToast = useCallback(
		(title, description, status) => {
			const safeDescription =
				description instanceof Error
					? description.message
					: typeof description === "string"
						? description
						: description == null
							? ""
							: typeof description === "object"
								? JSON.stringify(description)
								: String(description);
			toast({
				title,
				description: safeDescription,
				status,
				duration: 3000,
				isClosable: true,
			});
		},
		[toast]
	);

	return showToast;
};

export default useShowToast;
