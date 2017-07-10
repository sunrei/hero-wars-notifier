window.progrestar = {
    Math: {
        shuffle: function(array) {
            for(var i=0; i<array.length - 1; i++) {
                var offset = (Math.random() * (array.length - i) + i) ^ 0;

                var t = array[offset];
                array[offset] = array[i];
                array[i] = t;
            }
        }
    },
    flashGate: {
        emit: function (module, event, parameters) {

        }
    }
};