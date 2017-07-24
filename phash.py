# coding=utf-8
#!/usr/bin/env python

#Here is my hash functions!

import hashlib
import binascii

def hash_string(s):
    pilot = s.rstrip()
    pilot = pilot.replace(" ", "")
    dk = hashlib.pbkdf2_hmac('sha256', s, 'TEEEhEEE', 100000)
    return binascii.hexlify(dk)


print hash_string("Anders Olsson")
