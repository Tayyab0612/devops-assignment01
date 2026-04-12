pipeline {
  agent any

  triggers {
    githubPush()
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Deploy (Compose with code volume)') {
      steps {
        sh '''
          set -e
          docker compose -f docker-compose.ci.yml down || true
          docker compose -f docker-compose.ci.yml up -d
          docker ps
        '''
      }
    }
  }
}
