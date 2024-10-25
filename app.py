from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from dotenv import load_dotenv
import os
import openai

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS globally

openai.api_key = os.getenv('OPENAI_API_KEY')

movie_api_key = os.getenv('MOVIE_DB_API_KEY')

# Moderation function to check for inappropriate input
def moderate_input(user_input):
    print("hey")
    try:
        # Call the Moderation API with the correct model
        response = openai.Moderation.create(
            model="text-moderation-latest",  # Use a valid moderation model
            input=user_input
        )
        moderation_results = response["results"][0]

        # Print the full moderation response to the console
        print("Moderation Results: ", moderation_results)

        # Check if the input is flagged as inappropriate
        if moderation_results["flagged"]:
            return {"error": "Input violates content policy. Please try again with appropriate content."}, True
        return None, False

    except Exception as e:
        return {"error": f"An error occurred during moderation: {str(e)}"}, True

@app.route('/generate-movies', methods=['POST'])
def generate_movies():
    data = request.json
    user_input = data.get('input')

    if not user_input:
        return jsonify({'error': 'No input provided'}), 400

    print("before")
    # Check user input with the Moderation API before proceeding
    moderation_error, flagged = moderate_input(user_input)
    if flagged:
        return jsonify(moderation_error), 400

    print("after")
    
    try:
        # Custom prompt engineering
        prompt = f"""
        Generate a list of 20 movie recommendations based on the following description of the user, their life, or their taste in movies (movies they like, genres they enjoy, etc.). 
        Each recommendation should be in the following format:

        MovieTitle MatchPercentage

        For example:
        No Country for Old Men 90
        The Master 95

        Each movie should be followed by its match percentage.

        Important: Ensure there is **absolutely no additional text, explanation, commentary, or apologies** in the output. Do not include phrases like "Sorry" or "Here are 15 popular movie recommendations" under any circumstances. Only output the movie titles and match percentages.

        If the input is unclear or nonsensical, simply return a list of 15 popular movies with corresponding match percentages. No explanations or extra text should be included.

        Here is the user's input description:

        Description: {user_input}
        """

        # Send the input to OpenAI's API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=500
        )

        # Extract the response text from the OpenAI response
        suggestions = response.choices[0].message['content'].strip()

        # Return the response to the frontend
        return jsonify({'message': suggestions})

    except Exception as e:
        print(f"Error occurred: {e}")  # Print the error to the console
        return jsonify({'error': str(e)}), 500




@app.route('/get-movie-details', methods=['POST'])
def get_movie_details():
    import requests  # Import requests for API calls

    data = request.json
    movie_input = data.get('movie')

    if not movie_input:
        return jsonify({'error': 'No movie title provided'}), 400

    try:
        # Make a request to TMDb API to search for the movie by title
        url = f"https://api.themoviedb.org/3/search/movie?api_key={movie_api_key}&query={movie_input}"
        response = requests.get(url)

        # Check if the response was successful
        if response.status_code != 200:
            print(f"Failed to fetch movie details: {response.status_code} {response.text}")
            return jsonify({'error': f'Failed to fetch movie details from TMDb. Status code: {response.status_code}'}), 500

        results = response.json().get('results', [])
        if not results:
            print(f"No movie found for title: {movie_input}")
            return jsonify({'error': 'No movies found for the given title'}), 404

        # Get the first result (most relevant movie)
        movie = results[0]

        # Extract relevant movie details, including the poster URL
        movie_details = {
            "title": movie.get('title'),
            "description": movie.get('overview'),
            "release_date": movie.get('release_date'),
            "rating": movie.get('vote_average'),
            "genre_ids": movie.get('genre_ids'),
            "poster_url": f"https://image.tmdb.org/t/p/w200{movie.get('poster_path')}" if movie.get('poster_path') else None
        }

        # Return the movie details as JSON
        return jsonify(movie_details)

    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        return jsonify({'error': f'An exception occurred: {str(e)}'}), 500




@app.route('/')
def index():
    print("Homepage accessed")
    return "Welcome to the MovieFinderAI API! Moderation now set up, additional prompt engineering added and requirements updated!"

if __name__ == '__main__':
    app.run(debug=True)