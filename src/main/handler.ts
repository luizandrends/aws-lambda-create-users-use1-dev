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

  try {
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

    const response = await Promise.race([
      docClient.send(command),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000),
      ),
    ])

    return {
      isBase64Encoded: false,
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    }
  } catch (err) {
    return {
      isBase64Encoded: false,
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify("{'message': 'Internal Server Error'}"),
    }
  }
}
