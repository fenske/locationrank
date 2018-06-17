import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
admin.initializeApp()

export const updateCampaignProgress = functions.https.onRequest((request, response) => {
    if (request.body.event == "Geofence Entered") {
        const db = admin.firestore()
        const userRef = db.doc("/users/" + request.body.userId)
        db.runTransaction(function(transaction) {
            return transaction.get(userRef).then(function(user) {
                console.info(user.data())
                const updatedPlaces = user.data().places
                for (const p in updatedPlaces) {
                    const updatedCampaigns = updatedPlaces[p].campaigns;
                    for (const c in updatedCampaigns) {
                        updatedCampaigns[c] = updatedCampaigns[c] + 1;    
                    }
                }
                transaction.update(userRef, {places : updatedPlaces})
                return updatedPlaces
            })
        }).then(function(updatedPlaces) {
            console.log("Updated places with ", updatedPlaces)
            return response.status(200).send()
        }).catch(function(err) {
            console.error(err)
            return response.status(500).send()
        })
    }
});
