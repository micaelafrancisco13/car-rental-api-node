const express = require("express")
const { genSalt, hash } = require("bcrypt")
const { validateUser, generateUserAuthToken, validateModifiedUser } = require("../models/user")
const _ = require("lodash")
const auth = require("../filter-chains/auth")
const authorizeRoles = require("../filter-chains/authorizeRoles")
const { prismaClient } = require("../startup/database")
const router = express.Router()

router.get("/", [auth, authorizeRoles(["EMPLOYEE", "ADMIN"])], async (req, res) => {
	const users = await prismaClient.user.findMany()

	res.send(_.map(users, (user) => _.omit(user, "password")))
})

router.get("/me", [auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])], async (req, res) => {
	res.send(req.user)
})

router.get("/:id", [auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])], async (req, res) => {
	const { id } = req.params
	const user = await prismaClient.user.findUnique({ where: { id } })

	if (!user) return res.status(404).send("User not found")
	return res.send(_.omit(user, ["password"]))
})

router.post("/", async (req, res) => {
	const { error } = validateUser(req.body)
	if (error) return res.status(400).send(error.details[0].message)

	let user = await prismaClient.user.findUnique({
		where: { email: req.body.email },
	})
	if (user) return res.status(400).send(`The email ${req.body.email} is already used`)

	user = await prismaClient.user.findUnique({
		where: { phoneNumber: req.body.phoneNumber },
	})
	if (user)
		return res.status(400).send(`The phone number ${req.body.phoneNumber} is already used`)

	const hashedPassword = await hashPassword(req.body.password)
	const newUser = await prismaClient.user.create({
		data: {
			...req.body,
			password: hashedPassword,
		},
	})
	res.status(201)
		.header("Authorization", `Bearer ${generateUserAuthToken(newUser)}`)
		.header("access-control-expose-headers", "Authorization")
		.send(_.omit(newUser, ["password"]))
})


router.post("/update", [auth, authorizeRoles(["BOOKER", "EMPLOYEE", "ADMIN"])], async (req, res) => {
	const data = req.body
	if (!Array.isArray(data))
		return res.status(400).send("Invalid input: Expected an array of users.")

	for (let i = 0; i < data.length; ++i) {
		const user = data[i]
		const { error } = validateModifiedUser(user)
		if (error)
			return res.status(400).send(`${error.details[0].message} for the user at index ${i}`)
	}

	const userEmailSet = new Set()
	for (let i = 0; i < data.length; ++i) {
		const { email } = data[i].user
		if (userEmailSet.has(email))
			return res
				.status(400)
				.send(`Duplicate email detected: ${email} at index ${i}`)

		userEmailSet.add(email)
	}

	try {
		const updatedUsers = []

		await prismaClient.$transaction(async (prismaClient) => {
			for (let i = 0; i < data.length; ++i) {
				const { id, user } = data[i]

				const existingUser = await prismaClient.user.findUnique({
					where: { id },
				})
				if (!existingUser) throw new Error(`User at index ${i} not found`)

				const duplicateUser = await prismaClient.user.findFirst({
					where: {
						email: user.email,
						id: { not: id },
					},
				})

				if (duplicateUser)
					throw new Error(
						`Duplicate email detected: ${user.email} already exists (attempted update at index ${i})`,
					)

				const udpatedUser = await prismaClient.user.update({
					where: { id },
					data: { ...user },
				})
				updatedUsers.push(udpatedUser)
			}
		})

		res.send(updatedUsers)
	} catch (exception) {
		res.status(exception).send(exception.message)
	}
})

router.put("/:id", async (req, res) => {
	const { id } = req.params;
  
	const { error } = validateModifiedUser(req.params); // A separate validation function for updates
	if (error) return res.status(400).send(error.details[0].message);
  
	try {
	  let user = await prismaClient.user.findUnique({
		where: { id },
	  });
  
	  if (!user) return res.status(404).send(`User with ID ${id} not found`);
  
	  if (req.body.email) {
		const emailExists = await prismaClient.user.findUnique({
		  where: { email: req.body.email },
		});
		if (emailExists && emailExists.id !== user.id)
		  return res.status(400).send(`The email ${req.body.email} is already used`);
	  }
  
	  if (req.body.phoneNumber) {
		const phoneExists = await prismaClient.user.findUnique({
		  where: { phoneNumber: req.body.phoneNumber },
		});
		if (phoneExists && phoneExists.id !== user.id)
		  return res.status(400).send(`The phone number ${req.body.phoneNumber} is already used`);
	  }
  
	  let updatedData = { ...req.body };
	  if (req.body.password) {
		updatedData.password = await hashPassword(req.body.password);
	  }
  
	  user = await prismaClient.user.update({
		where: { id },
		data: updatedData,
	  });
  
	  res.status(200).send(user);
	} catch (err) {
	  console.error(err);
	  res.status(500).send("An error occurred while updating the user");
	}
  });

router.delete("/:id", async (req, res) => {
	const { id } = req.params
	const user = await prismaClient.user.findUnique({ where: { id } })
	if (!user) return res.status(404).send("User not found")
	
    await prismaClient.user.delete({ where: { id } });

    res.status(200).send({ message: "User deleted successfully" });
})

async function hashPassword(password) {
	const salt = await genSalt(13)
	return await hash(password, salt)
}

module.exports = router
