import os
import json
import csv
import random
import pandas as pd
from datetime import datetime, timedelta

# Make sure the data directory exists
os.makedirs('data', exist_ok=True)

def generate_synthetic_app_description(app_type="social"):
    """
    Generate a synthetic app description for training/testing purposes
    """
    app_descriptions = {
        "social": """
        Connect with friends and family with our social networking app.
        Share photos, videos, and updates with your followers.
        Chat with friends through private messaging.
        Create groups for specific interests or events.
        Discover new content with our personalized recommendation system.
        Follow your favorite celebrities, brands, and influencers.
        Set privacy controls to manage who can see your content.
        Customize your profile with themes and backgrounds.
        Share your location with friends for meetups.
        Post stories that disappear after 24 hours.
        """,
        
        "productivity": """
        Boost your productivity with our task management app.
        Create to-do lists and set priorities for your tasks.
        Set reminders and deadlines to stay on schedule.
        Organize tasks into projects and categories.
        Collaborate with teammates by sharing tasks and projects.
        Track your progress with visual charts and statistics.
        Sync your tasks across all your devices.
        Integrate with calendar apps for better scheduling.
        Use tags to filter and find specific tasks quickly.
        Get daily and weekly summaries of your accomplishments.
        """,
        
        "entertainment": """
        Enjoy unlimited streaming of movies and TV shows.
        Download content for offline viewing on the go.
        Create watchlists and receive personalized recommendations.
        Rate and review movies and shows you've watched.
        Continue watching from where you left off on any device.
        Browse content by genre, actors, or directors.
        Get notifications when new episodes of your favorite shows are available.
        Set up multiple profiles for different family members.
        Control playback quality to save data.
        Access exclusive original content only available on our platform.
        """
    }
    
    return app_descriptions.get(app_type, app_descriptions["social"])

def generate_feature_examples(app_description):
    """
    Generate labeled examples for feature classification
    Returns a list of (phrase, is_feature) tuples
    """
    from nltk.tokenize import sent_tokenize
    import spacy
    
    # Load spaCy model
    try:
        nlp = spacy.load("en_core_web_sm")
    except OSError:
        print("Downloading spaCy model. This may take a moment...")
        os.system("python -m spacy download en_core_web_sm")
        nlp = spacy.load("en_core_web_sm")
    
    sentences = sent_tokenize(app_description)
    
    positive_examples = []  # Feature phrases
    negative_examples = []  # Non-feature phrases
    
    for sentence in sentences:
        doc = nlp(sentence)
        
        # Extract potential feature phrases
        for chunk in doc.noun_chunks:
            if len(chunk.text.split()) >= 2:  # Longer than one word
                positive_examples.append(chunk.text.strip().lower())
        
        # Extract verb-object pairs
        for token in doc:
            if token.dep_ == "dobj" and token.head.pos_ == "VERB":
                phrase = f"{token.head.text} {token.text}".lower()
                positive_examples.append(phrase)
        
        # Generate some negative examples (random word combinations)
        words = [token.text for token in doc if not token.is_stop and token.is_alpha]
        if len(words) >= 2:
            for _ in range(min(2, len(words) - 1)):
                i = random.randint(0, len(words) - 2)
                negative_phrase = f"{words[i]} {words[i+1]}".lower()
                
                # Only add if it's not in positive examples
                if negative_phrase not in positive_examples:
                    negative_examples.append(negative_phrase)
    
    # Make sure we have unique examples
    positive_examples = list(set(positive_examples))
    negative_examples = list(set(negative_examples))
    
    # Create labeled examples
    examples = [(phrase, 1) for phrase in positive_examples]
    examples.extend([(phrase, 0) for phrase in negative_examples])
    
    return examples

def generate_synthetic_reviews(features, num_reviews=100, days_back=180):
    """
    Generate synthetic reviews mentioning the extracted features
    Returns a list of review dictionaries
    """
    # Templates for positive reviews
    positive_templates = [
        "I love the {feature}! It works perfectly.",
        "The {feature} is amazing, best app I've used.",
        "{feature} is exactly what I needed. Great job!",
        "This app has a great {feature} that makes everything easier.",
        "Finally an app with a good {feature}. Five stars!",
        "The {feature} works flawlessly, very impressed.",
        "I'm really enjoying the {feature} in this update.",
        "Great {feature}, intuitive and easy to use!"
    ]
    
    # Templates for negative reviews
    negative_templates = [
        "The {feature} is terrible, doesn't work at all.",
        "I hate how the {feature} keeps crashing.",
        "{feature} is buggy and frustrating to use.",
        "This app would be good if the {feature} actually worked.",
        "The {feature} is too complicated and confusing.",
        "Can't get the {feature} to work properly. Uninstalling!",
        "Disappointed with the {feature}, needs improvement.",
        "The {feature} is full of glitches. Fix it please!"
    ]
    
    # Templates for neutral reviews
    neutral_templates = [
        "The {feature} is okay, but could be better.",
        "I'm using the {feature} occasionally, it's decent.",
        "The {feature} works, but it's nothing special.",
        "Not sure about the {feature}, it's a bit hit or miss.",
        "Average {feature}, does what it's supposed to do.",
        "The {feature} is functional but basic.",
        "I have mixed feelings about the {feature}."
    ]
    
    # Reviews unrelated to any feature
    unrelated_reviews = [
        "This app is great!",
        "Terrible app, don't waste your time.",
        "App keeps crashing on my phone.",
        "Love it!",
        "Needs improvement.",
        "Works well on my device.",
        "Can't get it to work properly.",
        "Simple and easy to use.",
        "Too many ads!",
        "Worth the download.",
        "Not worth the storage space."
    ]
    
    reviews = []
    current_date = datetime.now()
    
    for i in range(num_reviews):
        # Decide if this review mentions a feature (70% chance)
        mentions_feature = random.random() < 0.7
        
        if mentions_feature:
            # Choose a random feature
            feature = random.choice(features)
            
            # Decide sentiment (40% positive, 30% negative, 30% neutral)
            sentiment = random.random()
            
            if sentiment < 0.4:  # Positive
                template = random.choice(positive_templates)
                rating = random.randint(4, 5)
            elif sentiment < 0.7:  # Negative
                template = random.choice(negative_templates)
                rating = random.randint(1, 2)
            else:  # Neutral
                template = random.choice(neutral_templates)
                rating = random.randint(3, 3)
                
            # Generate review text
            review_text = template.format(feature=feature)
        else:
            # Unrelated review
            review_text = random.choice(unrelated_reviews)
            
            # Assign random rating
            rating = random.randint(1, 5)
        
        # Generate random date within the time window
        days_ago = random.randint(0, days_back)
        review_date = (current_date - timedelta(days=days_ago)).strftime('%Y-%m-%d')
        
        # Create review dictionary
        review = {
            'text': review_text,
            'rating': rating,
            'date': review_date
        }
        
        reviews.append(review)
    
    return reviews

def generate_review_matching_examples(features, reviews):
    """
    Generate labeled examples for review matching
    Returns a list of (feature, review, is_matched) tuples
    """
    examples = []
    
    for feature in features:
        # Find reviews that actually mention this feature
        matched_reviews = [r['text'] for r in reviews if feature.lower() in r['text'].lower()]
        
        # Use up to 5 matched reviews
        for review in matched_reviews[:5]:
            examples.append((feature, review, 1))
            
        # Add some non-matching reviews
        non_matching = [r['text'] for r in reviews if feature.lower() not in r['text'].lower()]
        
        # Use up to 5 non-matching reviews
        for review in random.sample(non_matching, min(5, len(non_matching))):
            examples.append((feature, review, 0))
    
    return examples

def save_reviews_to_csv(reviews, output_file):
    """
    Save the generated reviews to a CSV file
    """
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['text', 'rating', 'date'])
        writer.writeheader()
        writer.writerows(reviews)
    
    print(f"Saved {len(reviews)} reviews to {output_file}")

def generate_training_data():
    """
    Generate training data for the KEFE model
    """
    print("Generating synthetic app descriptions...")
    app_types = ["social", "productivity", "entertainment"]
    
    all_feature_examples = []
    all_review_matching_examples = []
    
    for app_type in app_types:
        print(f"Processing {app_type} app...")
        app_description = generate_synthetic_app_description(app_type)
        
        # Save app description
        desc_file = os.path.join('data', f'{app_type}_app_description.txt')
        with open(desc_file, 'w', encoding='utf-8') as f:
            f.write(app_description)
        print(f"Saved app description to {desc_file}")
        
        # Generate feature examples
        feature_examples = generate_feature_examples(app_description)
        all_feature_examples.extend(feature_examples)
        
        # Extract features for generating reviews
        features = [phrase for phrase, is_feature in feature_examples if is_feature == 1]
        
        # Generate synthetic reviews
        reviews = generate_synthetic_reviews(features, num_reviews=200)
        
        # Save reviews
        reviews_file = os.path.join('data', f'{app_type}_reviews.csv')
        save_reviews_to_csv(reviews, reviews_file)
        
        # Generate review matching examples
        matching_examples = generate_review_matching_examples(features, reviews)
        all_review_matching_examples.extend(matching_examples)
    
    # Save feature classification training data
    feature_data_file = os.path.join('data', 'feature_training_data.csv')
    with open(feature_data_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['phrase', 'is_feature'])
        writer.writerows(all_feature_examples)
    print(f"Saved {len(all_feature_examples)} feature examples to {feature_data_file}")
    
    # Save review matching training data
    matching_data_file = os.path.join('data', 'review_matching_training_data.csv')
    with open(matching_data_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['feature', 'review', 'is_matched'])
        writer.writerows(all_review_matching_examples)
    print(f"Saved {len(all_review_matching_examples)} review matching examples to {matching_data_file}")
    
    return feature_data_file, matching_data_file

if __name__ == "__main__":
    # Generate training data
    feature_data_file, matching_data_file = generate_training_data()
    
    print("\nTo train the models using this data, run:")
    print(f"python english_kefe.py train --features {feature_data_file} --reviews {matching_data_file}")
    
    print("\nAfter training, try analyzing an app:")
    print("python english_kefe.py analyze --description data/social_app_description.txt --reviews data/social_reviews.csv --output output/social_analysis.json")