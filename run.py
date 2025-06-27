from api import create_app

app = create_app()

if __name__ == '__main__':
    print("➞ MAX_CONTENT_LENGTH:", app.config.get('MAX_CONTENT_LENGTH'))
    print("➞ Session storage enabled")
    app.run(debug=True, port=5328)