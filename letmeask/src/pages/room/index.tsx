import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import logoImg from "../../assets/images/logo.svg"
import { Button } from "../../components/button"
import { RoomCode } from "../../components/room-code"
import { useAuth } from "../../hooks/useAuth"
import { database } from "../../services/firebase"

import "../../styles/room.scss"

type FirebaseQuestions = Record<
	string,
	{
		author: {
			name: string
			avatar: string
		}
		content: string
		isAnswered: boolean
		isHighlighted: boolean
	}
>

type Question = {
	id: string
	author: {
		name: string
		avatar: string
	}
	content: string
	isAnswered: boolean
	isHighlighted: boolean
}

type RoomParams = {
	id: string
}

export const Room = () => {
	const { user } = useAuth()
	const params = useParams<RoomParams>()
	const [newQuestion, setNewQuestion] = useState("")
	const [questions, setQuestions] = useState<Question[]>([])
	const [title, setTitle] = useState("")
	const roomId = params.id

	useEffect(() => {
		const roomRef = database.ref(`rooms/${roomId}`)

		//TODO: ouvir 'value' significa ouvir toda e qualquer alteração nas listas, caso ouver muitas perguntas
		//este script acaba não sendo performatico!
		//utilizar: doc: firebase -> section-event-types -> child_added, etc
		roomRef.on("value", room => {
			const databaseRoom = room.val()
			const firebaseQuestions: FirebaseQuestions = databaseRoom.questions ?? {}

			const parsedQuestions = Object.entries(firebaseQuestions).map(
				([key, value]) => {
					return {
						id: key,
						content: value.content,
						author: value.author,
						isHighlighted: value.isHighlighted,
						isAnswered: value.isAnswered,
					}
				}
			)

			setTitle(databaseRoom.title)
			setQuestions(parsedQuestions)
		})
	}, [roomId])

	const handleSendQuestion = async (event: React.FormEvent) => {
		event.preventDefault()

		if (newQuestion.trim() === "") {
			return
		}

		if (!user) {
			throw new Error("You must be logged in")
		}

		const question = {
			content: newQuestion,
			author: {
				name: user?.name,
				avatar: user?.avatar,
			},
			isHighlighted: false,
			isAnswered: false,
		}

		await database.ref(`rooms/${roomId}/questions`).push(question)

		setNewQuestion("")
	}

	return (
		<div id='page-room'>
			<header>
				<div className='content'>
					<img src={logoImg} alt='Letmeask' />
					<RoomCode code={roomId} />
				</div>
			</header>
			<main className='content'>
				<div className='room-title'>
					<h1>Sala {title}</h1>
					{!!questions.length && <span>{questions.length} pergunta(s)</span>}
				</div>
				<form onSubmit={handleSendQuestion}>
					<textarea
						placeholder='O que você quer perguntar?'
						onChange={event => setNewQuestion(event.target.value)}
						value={newQuestion}
					/>
					<div className='form-footer'>
						{user ? (
							<div className='user-info'>
								<img src={user.avatar} alt={user.name} />
								<span>{user.name}</span>
							</div>
						) : (
							<span>
								Para enviar uma pergunta, <button>faça seu login</button>.
							</span>
						)}
						<Button type='submit' disabled={!user}>
							Enviar pergunta
						</Button>
					</div>
				</form>

				{JSON.stringify(questions)}
			</main>
		</div>
	)
}
