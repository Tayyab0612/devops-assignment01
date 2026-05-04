pipeline {
  agent any

  triggers {
    githubPush()
  }

  environment {
    APP_URL = 'http://localhost:3001'
  }

  stages {

    // ────────────────────────────────────────────
    // STAGE 1 — Checkout
    // ────────────────────────────────────────────
    stage('Checkout') {
      steps {
        echo '========== Checking out code from GitHub =========='
        checkout scm
        echo 'Checkout complete!'
      }
    }

    // ────────────────────────────────────────────
    // STAGE 2 — Deploy App via Docker Compose
    // ────────────────────────────────────────────
    stage('Deploy Application') {
      steps {
        echo '========== Deploying ShopZone with Docker Compose =========='
        sh '''
          set -e

          # Stop any running containers first
          docker compose -f docker-compose.ci.yml down --remove-orphans || true

          # Start fresh containers
          docker compose -f docker-compose.ci.yml up -d

          echo "Waiting 25 seconds for MongoDB + App to initialise..."
          sleep 25

          # Show running containers
          echo "--- Running containers ---"
          docker ps

          echo "--- App logs ---"
          docker logs shopzone_app_ci --tail=20 || true

          echo "App deployed on port 3001!"
        '''
      }
    }

    // ────────────────────────────────────────────
    // STAGE 3 — Build Selenium Test Docker Image
    // ────────────────────────────────────────────
    stage('Build Test Image') {
      steps {
        echo '========== Building Selenium Test Docker Image =========='
        sh '''
          docker build \
            -f Dockerfile.test \
            -t shopzone-selenium-tests:latest \
            .
          echo "Test image built!"
        '''
      }
    }

    // ────────────────────────────────────────────
    // STAGE 4 — Run Selenium Tests
    // ────────────────────────────────────────────
    stage('Run Selenium Tests') {
      steps {
        echo '========== Running Selenium Tests =========='
        sh '''
          # Clean previous results
          rm -rf ${WORKSPACE}/test-results
          mkdir -p ${WORKSPACE}/test-results

          # Run tests inside Docker
          # --network host  =>  container can reach localhost:3001
          docker run --rm \
            --network host \
            --name shopzone-test-runner \
            -e APP_URL=http://localhost:3001 \
            -v ${WORKSPACE}/test-results:/tests/test-results \
            shopzone-selenium-tests:latest \
            pytest test_app.py \
              -v \
              --html=/tests/test-results/report.html \
              --self-contained-html \
              --junit-xml=/tests/test-results/results.xml \
            2>&1 | tee ${WORKSPACE}/test-output.txt || true

          echo "Tests finished!"
        '''
      }
      post {
        always {
          junit allowEmptyResults: true,
                testResults: 'test-results/results.xml'
        }
      }
    }

    // ────────────────────────────────────────────
    // STAGE 5 — Publish HTML Report
    // ────────────────────────────────────────────
    stage('Publish Test Report') {
      steps {
        echo '========== Publishing HTML Test Report =========='
        publishHTML([
          allowMissing:          true,
          alwaysLinkToLastBuild: true,
          keepAll:               true,
          reportDir:             'test-results',
          reportFiles:           'report.html',
          reportName:            'Selenium Test Report'
        ])
        echo 'Report published!'
      }
    }

    // ────────────────────────────────────────────
    // STAGE 6 — Stop App (must be down per assignment)
    // ────────────────────────────────────────────
    stage('Stop Application') {
      steps {
        echo '========== Stopping Application =========='
        sh '''
          docker compose -f docker-compose.ci.yml down --remove-orphans || true
          echo "Application stopped - deployment is down as required by assignment"
        '''
      }
    }
  }

  // ────────────────────────────────────────────
  // POST — Email Results to Whoever Pushed
  // ────────────────────────────────────────────
  post {
    always {
      script {

        // Who made the push?
        def commitEmail = ''
        def commitName  = ''
        try {
          commitEmail = sh(
            script: "git log -1 --pretty=format:'%ae'",
            returnStdout: true
          ).trim()
          commitName = sh(
            script: "git log -1 --pretty=format:'%an'",
            returnStdout: true
          ).trim()
        } catch (Exception e) {
          commitEmail = 'tayyab@example.com'
          commitName  = 'Developer'
        }

        // Read test output log
        def testOutput = ''
        try {
          testOutput = readFile("${WORKSPACE}/test-output.txt")
        } catch (Exception e) {
          testOutput = 'Test output not available'
        }

        // Count results
        def passed  = (testOutput =~ /PASSED/).count
        def failed  = (testOutput =~ /FAILED/).count
        def skipped = (testOutput =~ /SKIPPED/).count

        def statusColor = (currentBuild.result == 'SUCCESS') ? '#28a745' : '#dc3545'
        def statusEmoji = (currentBuild.result == 'SUCCESS') ? '✅' : '❌'
        def statusText  = currentBuild.result ?: 'COMPLETED'

        echo "Sending email to: ${commitEmail}"

        emailext(
          subject: "[ShopZone Jenkins] Build #${BUILD_NUMBER} — ${statusText} | ${passed} Passed / ${failed} Failed",
          mimeType: 'text/html',
          to: "${commitEmail}",
          body: """
            <html>
            <body style="font-family:Arial,sans-serif;margin:20px;color:#333;">

              <h2 style="color:${statusColor};border-bottom:3px solid ${statusColor};padding-bottom:10px;">
                ${statusEmoji} ShopZone Jenkins Pipeline — ${statusText}
              </h2>

              <table style="border-collapse:collapse;width:75%;margin:20px 0;">
                <tr style="background:#f8f9fa;">
                  <td style="padding:10px;border:1px solid #dee2e6;width:35%;"><b>👤 Pushed By</b></td>
                  <td style="padding:10px;border:1px solid #dee2e6;">
                    ${commitName} (${commitEmail})
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px;border:1px solid #dee2e6;"><b>🔢 Build Number</b></td>
                  <td style="padding:10px;border:1px solid #dee2e6;">#${BUILD_NUMBER}</td>
                </tr>
                <tr style="background:#f8f9fa;">
                  <td style="padding:10px;border:1px solid #dee2e6;"><b>📊 Pipeline Status</b></td>
                  <td style="padding:10px;border:1px solid #dee2e6;">
                    <b style="color:${statusColor};">${statusText}</b>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px;border:1px solid #dee2e6;"><b>✅ Tests Passed</b></td>
                  <td style="padding:10px;border:1px solid #dee2e6;color:#28a745;">
                    <b>${passed}</b>
                  </td>
                </tr>
                <tr style="background:#f8f9fa;">
                  <td style="padding:10px;border:1px solid #dee2e6;"><b>❌ Tests Failed</b></td>
                  <td style="padding:10px;border:1px solid #dee2e6;color:#dc3545;">
                    <b>${failed}</b>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px;border:1px solid #dee2e6;"><b>⏭️ Tests Skipped</b></td>
                  <td style="padding:10px;border:1px solid #dee2e6;color:#fd7e14;">
                    <b>${skipped}</b>
                  </td>
                </tr>
                <tr style="background:#f8f9fa;">
                  <td style="padding:10px;border:1px solid #dee2e6;"><b>🔗 Build URL</b></td>
                  <td style="padding:10px;border:1px solid #dee2e6;">
                    <a href="${BUILD_URL}">${BUILD_URL}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px;border:1px solid #dee2e6;"><b>📋 HTML Report</b></td>
                  <td style="padding:10px;border:1px solid #dee2e6;">
                    <a href="${BUILD_URL}Selenium_Test_Report/">
                      View Full Selenium Report
                    </a>
                  </td>
                </tr>
              </table>

              <h3 style="margin-top:30px;">📝 Test Execution Log:</h3>
              <pre style="background:#1e1e1e;color:#d4d4d4;padding:20px;
                          border-radius:8px;font-size:11px;
                          overflow:auto;max-height:600px;
                          white-space:pre-wrap;word-wrap:break-word;
                          line-height:1.5;">
${testOutput}
              </pre>

              <hr style="margin-top:30px;"/>
              <p style="color:#6c757d;font-size:11px;">
                🤖 Auto-generated by Jenkins CI/CD Pipeline<br/>
                ShopZone E-Commerce | COMSATS University Islamabad | Assignment 3
              </p>

            </body>
            </html>
          """
        )
        echo "✅ Email sent to: ${commitEmail}"
      }
    }

    success {
      echo '✅ ALL STAGES PASSED!'
    }
    failure {
      echo '❌ PIPELINE FAILED — check console output'
    }
  }
}
JENKINSEOF
