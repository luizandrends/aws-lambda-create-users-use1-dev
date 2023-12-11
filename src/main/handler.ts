import { ALBEvent, ALBResult } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import { hash } from 'bcryptjs'
import { v4 as uuid } from 'uuid'

type LoadBalancerRequestEventInterface = {
  name: string
  email: string
  password: string
}

const client = new DynamoDBClient()
const docClient = DynamoDBDocumentClient.from(client)

export const handleRequest = async (event: ALBEvent): Promise<ALBResult> => {
  const requestBody: LoadBalancerRequestEventInterface = JSON.parse(
    event.body as string,
  )
  const hashedPassword = await hash(requestBody.password, 8)

  const command = new PutCommand({
    TableName: 'aws-dynamodb-users-table-use1-dev',
    Item: {
      id: uuid(),
      name: requestBody.name,
      email: requestBody.email,
      password: hashedPassword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  })

  const timeout = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Request timed out'))
    }, 5000) // 5 seconds timeout
  })

  try {
    const response = await Promise.race([docClient.send(command), timeout])
    console.log(response)
  } catch (error) {
    console.error('An error occurred:', error)
  }

  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify('Done'),
  }
}
