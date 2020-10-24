export const fetchDoc = (doc: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        doc.fetch((err) => {
            if (err)
                reject(err);
            resolve(doc);
        })
    });
}
