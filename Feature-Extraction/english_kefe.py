# English KEFE (Key Feature Extraction)
# Based on the paper "Identifying Key Features from App User Reviews"

import os
import re
import csv
import json
import nltk
import spacy
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict
import tensorflow as tf
from transformers import BertTokenizer, TFBertForSequenceClassification
from transformers import BertConfig, TFBertModel
from sklearn.model_selection import train_test_split
from sklearn.metrics import precision_recall_fscore_support
import statsmodels.api as sm

# Make sure necessary dependencies are downloaded
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

# Initialize spaCy model
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading spaCy model. This may take a moment...")
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Global variables
BERT_MODEL_NAME = 'bert-base-uncased'
MAX_SEQ_LENGTH = 128
BATCH_SIZE = 32
EPOCHS = 3
STOPWORDS = set(nltk.corpus.stopwords.words('english'))

# Add app-specific stopwords
APP_STOPWORDS = {
    'app', 'application', 'version', 'update', 'feature', 'bug', 'fix', 'issue',
    'please', 'thank', 'thanks', 'download', 'use', 'using', 'used', 'user', 'users'
}
STOPWORDS.update(APP_STOPWORDS)

# Create directories if they don't exist
os.makedirs('data', exist_ok=True)
os.makedirs('models', exist_ok=True)
os.makedirs('output', exist_ok=True)

###########################################
# PART 1: Feature Extraction Component
###########################################

class EnglishFeatureExtractor:
    """
    Extracts feature-describing phrases from app descriptions using English NLP
    techniques including dependency parsing and feature classification.
    """
    
    def __init__(self):
        self.nlp = nlp
        # Initialize feature classifier (BERT)
        self.tokenizer = BertTokenizer.from_pretrained(BERT_MODEL_NAME)
        # Load model
        self.model_path = os.path.join('models', 'feature_classifier')
        if os.path.exists(self.model_path):
            self.model = TFBertForSequenceClassification.from_pretrained(self.model_path)
            print("Loaded feature classifier model")
        else:
            print("Feature classifier model not found. Use train_feature_classifier() to train it.")
            self.model = None
            
    def preprocess_app_description(self, text):
        """Clean and preprocess app description text"""
        # Remove URLs
        text = re.sub(r'http\S+', '', text)
        # Remove special characters 
        text = re.sub(r'[^\w\s\.\,\?\!\:\;\-\']', ' ', text)
        # Remove whitespaces
        text = re.sub(r'\s+', ' ', text).strip()
        return text
        
    def extract_candidate_phrases(self, text):
        """Extract candidate feature phrases using dependency parsing"""
        text = self.preprocess_app_description(text)
        doc = self.nlp(text)
        
        candidate_phrases = []
        
        # Pattern 1: Verb-Object pairs (e.g., "send messages")
        for token in doc:
            if token.dep_ == "dobj" and token.head.pos_ == "VERB":
                verb = token.head.text
                obj = token.text
                
                # Get any adjective modifiers of the object
                adj_mods = [child.text for child in token.children if child.dep_ == "amod"]
                
                if adj_mods:
                    for adj in adj_mods:
                        feature = f"{verb} {adj} {obj}"
                        candidate_phrases.append(feature)
                else:
                    feature = f"{verb} {obj}"
                    candidate_phrases.append(feature)
        
        # Pattern 2: Noun phrases with adjective modifiers (e.g., "offline mode")
        for chunk in doc.noun_chunks:
            if len(chunk) > 1 and any(token.pos_ == "ADJ" for token in chunk):
                candidate_phrases.append(chunk.text)
        
        # Pattern 3: Compound nouns (e.g., "video player")
        for token in doc:
            if token.dep_ == "compound" and token.head.pos_ == "NOUN":
                compound = f"{token.text} {token.head.text}"
                candidate_phrases.append(compound)
                
        # Pattern 4: Prepositional phrases indicating features (e.g., "search for songs")
        for token in doc:
            if token.dep_ == "pobj" and token.head.dep_ == "prep" and token.head.head.pos_ == "VERB":
                verb = token.head.head.text
                prep = token.head.text
                obj = token.text
                feature = f"{verb} {prep} {obj}"
                candidate_phrases.append(feature)
                
        # Pattern 5: Technical features (single nouns that are likely features)
        technical_features = ['sync', 'backup', 'download', 'upload', 'share', 'chat', 
                              'notification', 'login', 'register', 'search', 'filter', 
                              'sort', 'payment', 'subscription', 'offline', 'profile']
        
        for token in doc:
            if token.text.lower() in technical_features:
                candidate_phrases.append(token.text)
                
        # Remove duplicates and very short phrases
        candidate_phrases = list(set([phrase.lower() for phrase in candidate_phrases if len(phrase) > 3]))
        
        return candidate_phrases
    
    def classify_features(self, candidate_phrases):
        """
        Use BERT classifier to determine if phrases are feature-describing
        Returns phrases classified as features
        """
        if not self.model:
            print("Feature classifier model not loaded. Cannot classify features.")
            return candidate_phrases  # Return all candidates if no model
            
        features = []
        
        # Prepare input for BERT
        for phrase in candidate_phrases:
            # Convert phrase to BERT input format
            encoded_input = self.tokenizer(
                phrase,
                padding='max_length',
                truncation=True,
                max_length=MAX_SEQ_LENGTH,
                return_tensors='tf'
            )
            
            # Make prediction
            output = self.model(encoded_input)
            logits = output.logits.numpy()[0]
            
            # Class 1 is "feature-describing", Class 0 is "not feature-describing"
            prediction = np.argmax(logits)
            
            if prediction == 1:  # Is a feature
                features.append(phrase)
                
        return features
    
    def extract_features(self, app_description):
        """
        Main method to extract features from app description
        """
        candidate_phrases = self.extract_candidate_phrases(app_description)
        
        if self.model:
            features = self.classify_features(candidate_phrases)
        else:
            # If no model is available, use basic filtering instead
            features = self._basic_feature_filter(candidate_phrases)
            
        return features
    
    def _basic_feature_filter(self, candidates):
        """Basic filtering for features when model is not available"""
        # Filter out phrases containing stopwords
        filtered = [phrase for phrase in candidates if not any(token.lower() in STOPWORDS for token in phrase.split())]
        
        # Keep phrases with known feature-related patterns
        feature_verbs = ['add', 'view', 'create', 'read', 'edit', 'delete', 'manage', 'search', 
                         'upload', 'download', 'share', 'send', 'receive', 'sync', 'stream', 
                         'play', 'pause', 'customize', 'save', 'load']
        
        feature_nouns = ['settings', 'profile', 'account', 'mode', 'backup', 'sync', 'notifications',
                         'dashboard', 'player', 'editor', 'viewer', 'browser', 'manager', 'options']
        
        likely_features = []
        
        for phrase in filtered:
            tokens = phrase.lower().split()
            
            # Check for feature verb patterns
            if any(token in feature_verbs for token in tokens) and len(tokens) >= 2:
                likely_features.append(phrase)
                continue
                
            # Check for feature noun patterns
            if any(token in feature_nouns for token in tokens):
                likely_features.append(phrase)
                continue
                
            # Verb-object patterns are likely features
            if len(tokens) == 2 and tokens[0] in feature_verbs:
                likely_features.append(phrase)
                continue
                
            # Adjective-noun patterns might be features
            doc = self.nlp(phrase)
            if len(doc) == 2 and doc[0].pos_ == "ADJ" and doc[1].pos_ == "NOUN":
                likely_features.append(phrase)
        
        return likely_features
    
    def train_feature_classifier(self, labeled_data_file):
        """
        Train the BERT model for feature classification
        labeled_data_file: CSV with columns 'phrase', 'is_feature' (1 or 0)
        """
        # Load labeled data
        try:
            data = pd.read_csv(labeled_data_file)
            
            # Check if data has required columns
            if 'phrase' not in data.columns or 'is_feature' not in data.columns:
                print("Error: Data file must have 'phrase' and 'is_feature' columns")
                return False
            
            # Split data
            train_data, test_data = train_test_split(data, test_size=0.2, random_state=42)
            
            # Create BERT input format
            train_encodings = self.tokenizer(
                list(train_data['phrase']),
                truncation=True,
                padding='max_length',
                max_length=MAX_SEQ_LENGTH,
                return_tensors='tf'
            )
            
            test_encodings = self.tokenizer(
                list(test_data['phrase']),
                truncation=True,
                padding='max_length',
                max_length=MAX_SEQ_LENGTH,
                return_tensors='tf'
            )
            
            # Create datasets
            train_dataset = tf.data.Dataset.from_tensor_slices((
                dict(train_encodings),
                tf.constant(train_data['is_feature'].values, dtype=tf.int32)
            )).batch(BATCH_SIZE)
            
            test_dataset = tf.data.Dataset.from_tensor_slices((
                dict(test_encodings),
                tf.constant(test_data['is_feature'].values, dtype=tf.int32)
            )).batch(BATCH_SIZE)
            
            # Initialize model for sequence classification
            self.model = TFBertForSequenceClassification.from_pretrained(
                BERT_MODEL_NAME,
                num_labels=2
            )
            
            # Compile model
            optimizer = tf.keras.optimizers.Adam(learning_rate=5e-5)
            loss = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
            metrics = ['accuracy']
            
            self.model.compile(optimizer=optimizer, loss=loss, metrics=metrics)
            
            # Train model
            self.model.fit(
                train_dataset,
                epochs=EPOCHS,
                validation_data=test_dataset
            )
            
            # Save model
            self.model.save_pretrained(self.model_path)
            print(f"Feature classifier model saved to {self.model_path}")
            
            # Evaluate model
            results = self.model.evaluate(test_dataset)
            print(f"Test loss: {results[0]}, Test accuracy: {results[1]}")
            
            return True
            
        except Exception as e:
            print(f"Error training feature classifier: {e}")
            return False

###########################################
# PART 2: User Review Matching Component
###########################################

class ReviewMatcher:
    """
    Matches app features with relevant user reviews
    """
    
    def __init__(self):
        self.nlp = nlp
        # Initialize BERT for review matching
        self.tokenizer = BertTokenizer.from_pretrained(BERT_MODEL_NAME)
        # Load model if it exists, otherwise create a new one
        self.model_path = os.path.join('models', 'review_matcher')
        if os.path.exists(self.model_path):
            self.model = TFBertForSequenceClassification.from_pretrained(self.model_path)
            print("Loaded review matcher model")
        else:
            print("Review matcher model not found. Use train_review_matcher() to train it.")
            self.model = None
    
    def preprocess_review(self, review):
        """Clean and preprocess review text"""
        # Remove URLs
        review = re.sub(r'http\S+', '', review)
        # Remove special characters 
        review = re.sub(r'[^\w\s\.\,\?\!\:\;\-\']', ' ', review)
        # Remove extra whitespaces
        review = re.sub(r'\s+', ' ', review).strip()
        
        return review
    
    def basic_feature_matching(self, feature, review):
        """
        Basic feature-review matching when model is not available
        Checks if feature words appear in review
        """
        review = review.lower()
        feature = feature.lower()
        
        # Check exact match
        if feature in review:
            return 1
            
        # Check if all words in feature appear in review
        feature_words = feature.split()
        if all(word in review.split() for word in feature_words):
            return 1
            
        # Check for partial match (at least half of feature words)
        if len(feature_words) > 1:
            matches = sum(1 for word in feature_words if word in review.split())
            if matches >= len(feature_words) / 2:
                return 1
                
        return 0
    
    def match_reviews(self, features, reviews):
        """
        Match features with relevant reviews
        Returns a dictionary of {feature: [matched_reviews]}
        """
        feature_review_map = defaultdict(list)
        
        # Process each review once
        processed_reviews = []
        for review_data in reviews:
            review_text = review_data.get('text', '')
            if not review_text:
                continue
                
            # Clean the review
            processed_text = self.preprocess_review(review_text)
            processed_review = {
                'processed_text': processed_text,
                'original': review_data  # Keep original data for reference
            }
            processed_reviews.append(processed_review)
        
        # For each feature, find matching reviews
        for feature in features:
            matched_reviews = []
            
            if self.model:
                # Use BERT model for matching
                for review in processed_reviews:
                    # Prepare input for BERT (feature + review)
                    text_pair = feature + " [SEP] " + review['processed_text']
                    
                    encoded_input = self.tokenizer(
                        text_pair,
                        padding='max_length',
                        truncation=True,
                        max_length=MAX_SEQ_LENGTH,
                        return_tensors='tf'
                    )
                    
                    # Make prediction
                    output = self.model(encoded_input)
                    logits = output.logits.numpy()[0]
                    
                    # Class 1 is "matched", Class 0 is "not matched"
                    prediction = np.argmax(logits)
                    
                    if prediction == 1:  # Feature is mentioned in review
                        matched_reviews.append(review['original'])
            else:
                # Use basic matching 
                for review in processed_reviews:
                    is_matched = self.basic_feature_matching(feature, review['processed_text'])
                    if is_matched:
                        matched_reviews.append(review['original'])
            
            feature_review_map[feature] = matched_reviews
        
        return feature_review_map
    
    def train_review_matcher(self, labeled_data_file):
        """
        Train the BERT model for review matching
        labeled_data_file: CSV with columns 'feature', 'review', 'is_matched' (1 or 0)
        """
        # Load labeled data
        try:
            data = pd.read_csv(labeled_data_file)
            
            # Check if data has required columns
            if 'feature' not in data.columns or 'review' not in data.columns or 'is_matched' not in data.columns:
                print("Error: Data file must have 'feature', 'review', and 'is_matched' columns")
                return False
            
            # Split data
            train_data, test_data = train_test_split(data, test_size=0.2, random_state=42)
            
            # Combine feature and review with [SEP] token for BERT input
            train_texts = [f + " [SEP] " + r for f, r in zip(train_data['feature'], train_data['review'])]
            test_texts = [f + " [SEP] " + r for f, r in zip(test_data['feature'], test_data['review'])]
            
            # Create BERT input format
            train_encodings = self.tokenizer(
                train_texts,
                truncation=True,
                padding='max_length',
                max_length=MAX_SEQ_LENGTH,
                return_tensors='tf'
            )
            
            test_encodings = self.tokenizer(
                test_texts,
                truncation=True,
                padding='max_length',
                max_length=MAX_SEQ_LENGTH,
                return_tensors='tf'
            )
            
            # Create datasets
            train_dataset = tf.data.Dataset.from_tensor_slices((
                dict(train_encodings),
                tf.constant(train_data['is_matched'].values, dtype=tf.int32)
            )).batch(BATCH_SIZE)
            
            test_dataset = tf.data.Dataset.from_tensor_slices((
                dict(test_encodings),
                tf.constant(test_data['is_matched'].values, dtype=tf.int32)
            )).batch(BATCH_SIZE)
            
            # Initialize model for sequence classification
            self.model = TFBertForSequenceClassification.from_pretrained(
                BERT_MODEL_NAME,
                num_labels=2
            )
            
            # Compile model
            optimizer = tf.keras.optimizers.Adam(learning_rate=5e-5)
            loss = tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True)
            metrics = ['accuracy']
            
            self.model.compile(optimizer=optimizer, loss=loss, metrics=metrics)
            
            # Train model
            self.model.fit(
                train_dataset,
                epochs=EPOCHS,
                validation_data=test_dataset
            )
            
            # Save model
            self.model.save_pretrained(self.model_path)
            print(f"Review matcher model saved to {self.model_path}")
            
            # Evaluate model
            results = self.model.evaluate(test_dataset)
            print(f"Test loss: {results[0]}, Test accuracy: {results[1]}")
            
            # Calculate precision, recall, and F1 score
            y_pred = []
            for batch in test_dataset:
                logits = self.model(batch[0]).logits
                predictions = tf.argmax(logits, axis=-1).numpy()
                y_pred.extend(predictions)
            
            precision, recall, f1, _ = precision_recall_fscore_support(
                test_data['is_matched'].values, y_pred, average='binary'
            )
            
            print(f"Precision: {precision:.4f}")
            print(f"Recall: {recall:.4f}")
            print(f"F1 Score: {f1:.4f}")
            
            return True
            
        except Exception as e:
            print(f"Error training review matcher: {e}")
            return False

###########################################
# PART 3: Key Feature Identification Component
###########################################

class KeyFeatureIdentifier:
    """
    Identifies key features that significantly correlate with app ratings
    """
    
    def __init__(self):
        pass
    
    def prepare_data_for_regression(self, feature_review_map, time_window=180):
        """
        Prepare time-series data for regression analysis
        Returns features and their daily positive/negative review counts
        
        time_window: Number of days to analyze (default: 180 days)
        """
        # Prepare date range (from current date backwards)
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=time_window)
        date_range = pd.date_range(start=start_date, end=end_date)
        
        # Prepare data structures for regression
        feature_data = {}
        all_positive_reviews = {date: 0 for date in date_range}
        all_negative_reviews = {date: 0 for date in date_range}
        
        # Initialize feature data structure
        for feature in feature_review_map:
            feature_data[feature] = {
                'positive_reviews': {date: 0 for date in date_range},
                'negative_reviews': {date: 0 for date in date_range}
            }
        
        # Process reviews for each feature
        for feature, reviews in feature_review_map.items():
            for review in reviews:
                # Get review date
                review_date_str = review.get('date', '')
                if not review_date_str:
                    continue
                
                try:
                    # Parse date (assuming format is YYYY-MM-DD or similar)
                    review_date = pd.to_datetime(review_date_str).date()
                    
                    # Skip if review date is outside our time window
                    if review_date < start_date or review_date > end_date:
                        continue
                    
                    # Get review rating
                    rating = float(review.get('rating', 0))
                    
                    # Count as positive or negative review
                    if rating >= 4:  # 4-5 stars is positive
                        feature_data[feature]['positive_reviews'][review_date] += 1
                        all_positive_reviews[review_date] += 1
                    elif rating <= 2:  # 1-2 stars is negative
                        feature_data[feature]['negative_reviews'][review_date] += 1
                        all_negative_reviews[review_date] += 1
                except Exception as e:
                    # Skip problematic reviews
                    continue
        
        # Convert to pandas Series for regression
        all_positive_series = pd.Series(all_positive_reviews)
        all_negative_series = pd.Series(all_negative_reviews)
        
        feature_series = {}
        for feature in feature_data:
            pos_series = pd.Series(feature_data[feature]['positive_reviews'])
            neg_series = pd.Series(feature_data[feature]['negative_reviews'])
            
            # Only keep features with at least some reviews
            if pos_series.sum() > 0 or neg_series.sum() > 0:
                feature_series[feature] = {
                    'positive_reviews': pos_series,
                    'negative_reviews': neg_series
                }
        
        return feature_series, all_positive_series, all_negative_series
    
    def identify_key_features(self, feature_series, all_positive_series, all_negative_series, significance_level=0.05):
        """
        Identify key features using regression analysis
        Returns list of key features and their significance data
        
        significance_level: p-value threshold for significance (default: 0.05)
        """
        key_features = []
        
        # Run regression for positive reviews
        positive_key_features = self._run_regression(
            feature_series, 
            all_positive_series, 
            'positive_reviews', 
            significance_level
        )
        
        # Run regression for negative reviews
        negative_key_features = self._run_regression(
            feature_series, 
            all_negative_series, 
            'negative_reviews', 
            significance_level
        )
        
        # Combine key features, keeping track of whether they are positive or negative
        all_key_features = {}
        
        for feature, data in positive_key_features.items():
            if feature not in all_key_features:
                all_key_features[feature] = {'positive': data, 'negative': None}
            else:
                all_key_features[feature]['positive'] = data
        
        for feature, data in negative_key_features.items():
            if feature not in all_key_features:
                all_key_features[feature] = {'positive': None, 'negative': data}
            else:
                all_key_features[feature]['negative'] = data
        
        # Format results
        for feature, data in all_key_features.items():
            feature_info = {
                'feature': feature,
                'positive_impact': data['positive'] is not None,
                'negative_impact': data['negative'] is not None,
                'positive_p_value': data['positive']['p_value'] if data['positive'] else None,
                'negative_p_value': data['negative']['p_value'] if data['negative'] else None,
                'positive_coefficient': data['positive']['coefficient'] if data['positive'] else None,
                'negative_coefficient': data['negative']['coefficient'] if data['negative'] else None
            }
            key_features.append(feature_info)
        
        # Sort by significance (most significant first)
        key_features.sort(key=lambda x: min(
            x['positive_p_value'] if x['positive_p_value'] is not None else 1.0,
            x['negative_p_value'] if x['negative_p_value'] is not None else 1.0
        ))
        
        return key_features
    
    def _run_regression(self, feature_series, all_reviews_series, review_type, significance_level):
        """
        Run regression analysis to identify significant features
        
        feature_series: Dict of features with their review counts
        all_reviews_series: Series of all review counts
        review_type: 'positive_reviews' or 'negative_reviews'
        significance_level: p-value threshold
        
        Returns dict of significant features with p-values and coefficients
        """
        significant_features = {}
        
        # Prepare independent variables (feature review counts)
        X = pd.DataFrame()
        for feature, data in feature_series.items():
            if data[review_type].sum() > 0:  # Only include features with reviews
                X[feature] = data[review_type]
        
        # If no features have reviews, return empty dict
        if X.empty:
            return significant_features
        
        # Add constant for intercept
        X = sm.add_constant(X)
        
        # Dependent variable (all review counts)
        y = all_reviews_series
        
        try:
            # Run OLS regression
            model = sm.OLS(y, X)
            results = model.fit()
            
            # Identify significant features
            for feature in X.columns:
                if feature == 'const':  # Skip intercept
                    continue
                
                p_value = results.pvalues[feature]
                coefficient = results.params[feature]
                
                # Check if p-value is below threshold
                if p_value < significance_level:
                    significant_features[feature] = {
                        'p_value': p_value,
                        'coefficient': coefficient
                    }
        except Exception as e:
            print(f"Error in regression analysis: {e}")
        
        return significant_features

###########################################
# PART 4: Main KEFE System
###########################################

class EnglishKEFE:
    """
    Main class for English Key Feature Extraction system
    """
    
    def __init__(self):
        self.feature_extractor = EnglishFeatureExtractor()
        self.review_matcher = ReviewMatcher()
        self.key_feature_identifier = KeyFeatureIdentifier()
    
    def extract_features(self, app_description):
        """Extract features from app description"""
        return self.feature_extractor.extract_features(app_description)
    
    def match_reviews(self, features, reviews):
        """Match features with reviews"""
        return self.review_matcher.match_reviews(features, reviews)
    
    def identify_key_features(self, feature_review_map, time_window=180, significance_level=0.05):
        """Identify key features using regression analysis"""
        feature_series, all_positive_series, all_negative_series = self.key_feature_identifier.prepare_data_for_regression(
            feature_review_map, time_window
        )
        
        return self.key_feature_identifier.identify_key_features(
            feature_series, all_positive_series, all_negative_series, significance_level
        )
    
    def analyze_app(self, app_description, reviews, time_window=180, significance_level=0.05):
        """
        Analyze app to identify key features
        
        app_description: String containing app description
        reviews: List of review dictionaries with 'text', 'rating', 'date' keys
        time_window: Number of days to analyze (default: 180)
        significance_level: p-value threshold for significance (default: 0.05)
        
        Returns dict with extracted features, matched reviews, and key features
        """
        # Step 1: Extract features
        print("Extracting features from app description...")
        features = self.extract_features(app_description)
        #print(features)
        features = features if len(features) < 51 else features[:51]
        print(f"Extracted {len(features)} features")
        
        # Step 2: Match reviews with features
        print("Matching reviews with features...")
        feature_review_map = self.match_reviews(features, reviews)
        
        # Count matched reviews for each feature
        feature_review_counts = {}
        for feature, matched_reviews in feature_review_map.items():
            feature_review_counts[feature] = len(matched_reviews)
        
        # Sort features by review count (most mentioned first)
        sorted_features = sorted(
            feature_review_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        print(f"Top mentioned features:")
        for feature, count in sorted_features[:10]:  # Show top 10
            print(f"  - {feature}: {count} reviews")
        
        # Step 3: Identify key features
        print("Identifying key features...")
        key_features = self.identify_key_features(
            feature_review_map, time_window, significance_level
        )
        
        print(f"Identified {len(key_features)} key features")
        for feature_info in key_features[:5]:  # Show top 5
            feature = feature_info['feature']
            if feature_info['positive_impact']:
                print(f"  + {feature}: Positively impacts ratings (p={feature_info['positive_p_value']:.4f})")
            if feature_info['negative_impact']:
                print(f"  - {feature}: Negatively impacts ratings (p={feature_info['negative_p_value']:.4f})")
        
        # Prepare result
        result = {
            'features': features,
            'feature_review_map': feature_review_map,
            'key_features': key_features
        }
        
        return result
    
    def train_models(self, feature_data_file, review_matching_data_file):
        """
        Train the feature classifier and review matcher models
        
        feature_data_file: CSV with columns 'phrase', 'is_feature' (1 or 0)
        review_matching_data_file: CSV with columns 'feature', 'review', 'is_matched' (1 or 0)
        
        Returns True if training was successful
        """
        print("Training feature classifier...")
        feature_result = self.feature_extractor.train_feature_classifier(feature_data_file)
        
        print("Training review matcher...")
        matcher_result = self.review_matcher.train_review_matcher(review_matching_data_file)
        
        return feature_result and matcher_result
    
    def save_results(self, results, output_file):
        """
        Save analysis results to a JSON file
        """
        # Convert to serializable format
        serializable_results = {
            'features': results['features'],
            'key_features': results['key_features'],
            'feature_review_counts': {
                feature: len(reviews) 
                for feature, reviews in results['feature_review_map'].items()
            }
        }
        
        # Save to file
        with open(output_file, 'w') as f:
            json.dump(serializable_results, f, indent=2)
        
        print(f"Results saved to {output_file}")

###########################################
# PART 5: Utility Functions
###########################################

def load_app_description(file_path):
    """Load app description from a text file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def load_reviews_from_csv(file_path):
    """
    Load reviews from a CSV file
    Expected columns: text, rating, date (optional)
    """
    reviews = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Check for required fields
            if 'text' not in row or 'rating' not in row:
                continue
                
            review = {
                'text': row['text'],
                'rating': float(row['rating']) if row['rating'] else 0,
                'date': row.get('date', datetime.now().strftime('%Y-%m-%d'))
            }
            
            reviews.append(review)
    
    return reviews

def create_training_data_file(output_file, examples):
    """
    Create a CSV file for training the feature classifier
    
    output_file: Path to save the CSV file
    examples: List of tuples (phrase, is_feature)
    """
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['phrase', 'is_feature'])
        
        for phrase, is_feature in examples:
            writer.writerow([phrase, int(is_feature)])
    
    print(f"Training data saved to {output_file}")

def create_review_matching_data_file(output_file, examples):
    """
    Create a CSV file for training the review matcher
    
    output_file: Path to save the CSV file
    examples: List of tuples (feature, review, is_matched)
    """
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['feature', 'review', 'is_matched'])
        
        for feature, review, is_matched in examples:
            writer.writerow([feature, review, int(is_matched)])
    
    print(f"Training data saved to {output_file}")

###########################################
# PART 6: Example Usage
###########################################

def example_usage():
    """Example of how to use the English KEFE system"""
    # Initialize KEFE
    kefe = EnglishKEFE()
    
    # Sample app description
    app_description = """
    Our music streaming app allows you to listen to millions of songs and podcasts.
    Create custom playlists and share them with friends. Download music for offline listening.
    Discover new artists with personalized recommendations based on your listening history.
    Sync your music across all your devices. Customize equalizer settings for the perfect sound.
    With premium subscription, enjoy ad-free listening and high-quality audio.
    """
    
    # Sample reviews
    reviews = [
        {
            'text': "Love the offline mode, perfect for when I'm traveling!",
            'rating': 5,
            'date': '2023-01-15'
        },
        {
            'text': 'The app keeps crashing when I try to create playlists.',
            'rating': 2,
            'date': '2023-01-20'
        },
        {
            'text': "Great recommendation system. I've discovered so many new artists.",
            'rating': 5,
            'date': '2023-02-05'
        },
        {
            'text': "Can't sync my music between my phone and laptop.",
            'rating': 1,
            'date': '2023-02-10'
        },
        {
            'text': 'The equalizer is awesome, I can adjust the sound exactly how I want.',
            'rating': 5,
            'date': '2023-03-01'
        }
    ]
    
    # Analyze app
    print("Analyzing app...")
    results = kefe.analyze_app(app_description, reviews)
    
    # Save results
    kefe.save_results(results, 'output/example_results.json')

###########################################
# PART 7: Command Line Interface
###########################################

def main():
    """Main function for command line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='English Key Feature Extraction (KEFE) System')
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Parser for extracting features
    extract_parser = subparsers.add_parser('extract', help='Extract features from app description')
    extract_parser.add_argument('--description', '-d', required=True, help='App description file path')
    extract_parser.add_argument('--output', '-o', default='output/features.json', help='Output file path')
    
    # Parser for analyzing app
    analyze_parser = subparsers.add_parser('analyze', help='Analyze app to identify key features')
    analyze_parser.add_argument('--description', '-d', required=True, help='App description file path')
    analyze_parser.add_argument('--reviews', '-r', required=True, help='Reviews CSV file path')
    analyze_parser.add_argument('--output', '-o', default='output/analysis.json', help='Output file path')
    analyze_parser.add_argument('--window', '-w', type=int, default=180, help='Time window in days (default: 180)')
    analyze_parser.add_argument('--significance', '-s', type=float, default=0.05, help='Significance level (default: 0.05)')
    
    # Parser for training models
    train_parser = subparsers.add_parser('train', help='Train feature classifier and review matcher models')
    train_parser.add_argument('--features', '-f', required=True, help='Feature training data CSV file path')
    train_parser.add_argument('--reviews', '-r', required=True, help='Review matching training data CSV file path')
    
    # Parse arguments
    args = parser.parse_args()
    
    # Initialize KEFE
    kefe = EnglishKEFE()
    
    # Execute command
    if args.command == 'extract':
        # Load app description
        app_description = load_app_description(args.description)
        
        # Extract features
        features = kefe.extract_features(app_description)
        
        # Save features to JSON file
        with open(args.output, 'w') as f:
            json.dump(features, f, indent=2)
        
        print(f"Extracted {len(features)} features and saved to {args.output}")
    
    elif args.command == 'analyze':
        # Load app description
        app_description = load_app_description(args.description)
        
        # Load reviews
        reviews = load_reviews_from_csv(args.reviews)
        
        # Analyze app
        results = kefe.analyze_app(
            app_description, 
            reviews, 
            args.window, 
            args.significance
        )
        
        # Save results
        kefe.save_results(results, args.output)
    
    elif args.command == 'train':
        # Train models
        kefe.train_models(args.features, args.reviews)
    
    else:
        # Run example usage if no command specified
        example_usage()

if __name__ == "__main__":
    main()