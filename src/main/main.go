package main

import (
	"context"
	"fmt"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func handleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Your "Hello World" logic here
	message := "Hello, World!"

	fmt.Println(request)

	// Sample Load Balancer Response Document
	response := events.APIGatewayProxyResponse{
		IsBase64Encoded: false,
		StatusCode:      200,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: message,
	}

	return response, nil
}

func main() {
	lambda.Start(handleRequest)
}