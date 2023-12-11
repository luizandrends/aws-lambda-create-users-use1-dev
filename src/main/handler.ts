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

export const handleRequest = async (event: ALBEvent): Promise<ALBResult> => {
  const client = new DynamoDBClient({ region: 'us-east-1' })
  const docClient = DynamoDBDocumentClient.from(client)
  const requestBody: LoadBalancerRequestEventInterface = JSON.parse(
    event.body as string,
  )

  try {
    const hashedPassword = await hash(requestBody.password, 8)

    console.log(requestBody, 'Request Body')
    console.log(requestBody.name, 'Name')
    console.log(requestBody.email, 'Email')
    console.log(requestBody.password, 'Password')

    const command = new PutCommand({
      TableName: 'aws-dynamodb-users-table-use1-dev',
      Item: {
        id: uuid(),
        name: requestBody.name,
        email: requestBody.email,
        password: hashedPassword,
      },
    })

    console.log(command, 'Command')

    const response = await docClient.send(command)

    console.log(response, 'Response')

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
