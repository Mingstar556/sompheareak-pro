import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              An error occurred while loading this screen.
            </Text>
            {this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.reloadButton} onPress={this.handleReset}>
              <Text style={styles.reloadButtonText}>🔄 Reload Application</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.reloadButton, { backgroundColor: '#ef4444', marginTop: 10 }]}
              onPress={() => {
                if (typeof window !== 'undefined' && window.localStorage) {
                  try { window.localStorage.clear(); } catch(e) {}
                  window.location.reload();
                } else {
                  this.handleReset();
                }
              }}
            >
              <Text style={styles.reloadButtonText}>🧹 Reset Local Cache & Restart</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0e17',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 400,
  },
  errorBox: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
    marginBottom: 20,
    maxWidth: '90%',
  },
  errorText: {
    color: '#fca5a5',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  reloadButton: {
    backgroundColor: '#d4af37',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  reloadButtonText: {
    color: '#0c0e17',
    fontWeight: '700',
    fontSize: 15,
  },
});
