export const generateTemporalPassword = () => {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	let password = ""

	for (let i = 0; i < 8; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length)
		password += characters.charAt(randomIndex)
	}

	return password
}
